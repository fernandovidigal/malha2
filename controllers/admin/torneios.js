const sequelize = require('../../helpers/database');
const Torneio = require('../../models/Torneios');
const Escaloes = require('../../models/Escaloes');
const Campos = require('../../models/Campos');
const { validationResult } = require('express-validator/check');

function setTorneioActivo(id){
    return sequelize.transaction(t => {
        return sequelize.query("UPDATE torneios SET activo = 0", {transaction: t})
        .then(() => {
            Torneio.update(
                {activo: 1},
                {where: {torneioId: id}, limit: 1},
                {transaction: t}
            )
        })
    })
    .then(result => {
        return true;
    })
    .catch(err => {
        return false;
    });
}

function getTorneio(torneioId){
    return Torneio.findByPk(torneioId);
}

function getAllEscaloes(){
    return Escaloes.findAll({raw: true});
}

function getCamposPorTorneio(torneioId){
    return Campos.findAll({
        where: {
            torneioId: torneioId
        },
        raw: true
    });
}

function getAllEscaloesECampos(torneioId){
    return Escaloes.findAll({
        include: {
            model: Campos,
            attributes: ['numCampos'],
            where: {
                torneioId: torneioId
            },
        }
    });
}

exports.getAllTorneios = (req, res, next) => {
    Torneio.findAll({
        order: [['ano', 'DESC']],
        raw: true
    })
    .then(torneios => {
        res.render('admin/torneios', {torneios: torneios});
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados dos torneios!');
        res.redirect('/admin/torneios');
    });
}

exports.getTorneio = (req, res, next) => {
    const torneioId = req.params.id;

    try {
        const escaloes = getAllEscaloesECampos(torneioId);
        const torneio = getTorneio(torneioId);

        Promise.all([escaloes, torneio])
        .then(([_escaloes, _torneio]) => {
            const escaloes = {};
            escaloes.masculinos = _escaloes.filter(escalao => escalao.sexo == 1);
            escaloes.femininos = _escaloes.filter(escalao => escalao.sexo == 0);

            res.render('admin/editarTorneio', {torneio: _torneio, escaloes: escaloes});
        })
        .catch(err => {
            throw new Error(err);
        });

    } catch(err) {
        console.log(err);
        req.flash('error', 'Não é possível editar o torneio.');
        res.redirect('/admin/torneios');
    }
}

exports.adicionarTorneio = (req, res, next) => {

    getAllEscaloes()
    .then( _escaloes => {
        const escaloes = {};
        escaloes.masculinos = _escaloes.filter(escalao => escalao.sexo == 1);
        escaloes.femininos = _escaloes.filter(escalao => escalao.sexo == 0);

        res.render('admin/adicionarTorneio', {escaloes: escaloes});
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não é possivel adicionar torneio. Sem acesso à lista de escalões.');
        res.redirect('/admin/torneios');
    });
}

async function processaCriacaoCampos(transaction, torneioId, listaCampos, listaCamposIds){
    let i = 0;

    for(const escalao of listaCampos){
        await Campos.create({
            torneioId: torneioId,
            escalaoId: listaCamposIds[i],
            numCampos: listaCampos[i]
        }, {transaction});
        i++;
    }
}

exports.createTorneio = async (req, res, next) => {
    const designacao = req.body.designacao.trim();
    const localidade = req.body.localidade.trim();
    const ano = req.body.ano.trim();
    const errors = validationResult(req);
    let camposMasculinos =  req.body.camposMasculinos;
    const escalaoIdMasculinos = req.body.escalaoIdMasculinos;
    let camposFemininos = req.body.camposFemininos;
    const escalaoIdFemininos = req.body.escalaoIdFemininos;

    // Valida número de campos introduzidos
    camposMasculinos = camposMasculinos.map(campo => (campo != '' && !isNaN(campo)) ? parseInt(campo) : 0);
    camposFemininos = camposFemininos.map(campo => (campo != '' && !isNaN(campo)) ? parseInt(campo) : 0);

    // Processa todos os escalões
    const _escaloes = await getAllEscaloes();
    const escaloes = {};
    escaloes.masculinos = _escaloes.filter(escalao => escalao.sexo == 1);
    escaloes.femininos = _escaloes.filter(escalao => escalao.sexo == 0);

    if(!errors.isEmpty()){
        const oldData = {
            designacao: designacao,
            localidade: localidade,
            ano: ano,
            camposMasculinos: camposMasculinos,
            escalaoIdMasculinos: escalaoIdMasculinos,
            camposFemininos: camposFemininos,
            escalaoIdFemininos: escalaoIdFemininos
        }
        res.render('admin/adicionarTorneio', {validationErrors: errors.array({ onlyFirstError: true }), escaloes: escaloes, oldData: oldData});
    } else {
        let torneioCriadoId = 0;
        let transaction;

        try {
            transaction = await sequelize.transaction();

            let torneioCriado = await Torneio.create({
                                            designacao: designacao,
                                            localidade: localidade,
                                            ano: ano
                                        }, {transaction});
            
            torneioCriadoId = torneioCriado.torneioId;

            await processaCriacaoCampos(transaction, torneioCriadoId, camposMasculinos, escalaoIdMasculinos);
            await processaCriacaoCampos(transaction, torneioCriadoId, camposFemininos, escalaoIdFemininos);

            await transaction.commit();

        } catch(err) {
            console.log(err);
            if(err) await transaction.rollback();
        }

        if(transaction.finished === 'commit'){
            // Escolheu adicionar e activar o torneios
            if(req.body.adicionar_activar){
                if(await setTorneioActivo(torneioId)){
                    req.flash('success', 'Torneio adicionado e activado com sucesso.')
                    res.redirect('/admin/torneios');
                } else {
                    req.flash('error', 'Não foi possível activar o torneio.');
                    res.redirect('/admin/torneios');
                }
            } else {
                // Escolheu só adicionar o torneio

                // Se só existe 1 torneio registado este fica activo
                Torneio.count()
                .then(async count => {
                    if(count == 1){
                        if(await setTorneioActivo(torneioId)){
                            req.flash('success', 'Torneio adicionado e activado com sucesso.')
                            res.redirect('/admin/torneios');
                        } else {
                            req.flash('error', 'Não foi possível activar o torneio.');
                            res.redirect('/admin/torneios');
                        }
                    } else {
                        // Existem mais que 1 torneios registados, adicionar apenas
                        req.flash('success', 'Torneio adicionado e activado com sucesso.')
                        res.redirect('/admin/torneios');
                    }
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error', 'Não foi possível activar o torneio.');
                    res.redirect('/admin/torneios');
                });
            }
        } else {
            req.flash('error', 'Não foi possível adicionar o torneio.');
            res.redirect('/admin/torneios');
        }
    }
}

exports.ActivaTorneio = (req, res, next) => {
    const torneioId = req.params.id;

    Torneio.findByPk(torneioId)
    .then(async torneio => {
        if(torneio){
            if(await setTorneioActivo(torneio.torneioId)){
                req.flash('success', `Torneio, ${torneio.designacao}, activado com sucesso.`)
                res.redirect('/admin/torneios');
            } else {
                req.flash('error', 'Não foi possível activar o torneio.');
                res.redirect('/admin/torneios');
            }
        } else{
            req.flash('error', 'Torneio não existe.')
            res.redirect('/admin/torneios');
        }
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível activar o torneio.')
        res.redirect('/admin/torneios');
    });
}

function processaCamposParaEscalao(escaloes, listaIds, listaCampos){
    escaloes.forEach(escalao => {
        escalao.campos = [];
        listaIds.forEach((id, index) => {
            if(escalao.escalaoId == id){
                const numCampos = {
                    numCampos: listaCampos[index]
                }
                escalao.campos.push(numCampos);
            }
        });
    });
}

async function processaUpdateCampos(transaction, torneioId, listaCampos, listaIds){
    let i = 0;
    for(const escalao of listaCampos){
        let escalaoCamposToUpdate = await Campos.findOne({
            where: {
                torneioId: torneioId,
                escalaoId: listaIds[i]
            }
        }, {transaction});

        await escalaoCamposToUpdate.update({numCampos: listaCampos[i]}, {transaction});
        i++;
    }
}

exports.updateTorneio = async (req, res, next) => {
    const torneioId = req.params.id;
    const designacao = req.body.designacao.trim();
    const localidade = req.body.localidade.trim();
    const ano = req.body.ano.trim();
    const errors = validationResult(req);
    let camposMasculinos =  req.body.camposMasculinos;
    const escalaoIdMasculinos = req.body.escalaoIdMasculinos;
    let camposFemininos = req.body.camposFemininos;
    const escalaoIdFemininos = req.body.escalaoIdFemininos;

    // Valida número de campos introduzidos
    camposMasculinos = camposMasculinos.map(campo => (campo != '' && !isNaN(campo)) ? parseInt(campo) : 0);
    camposFemininos = camposFemininos.map(campo => (campo != '' && !isNaN(campo)) ? parseInt(campo) : 0);

    // Processa todos os escalões
    const _escaloes = await getAllEscaloes();
    const escaloes = {};
    escaloes.masculinos = _escaloes.filter(escalao => escalao.sexo == 1);
    escaloes.femininos = _escaloes.filter(escalao => escalao.sexo == 0);

    processaCamposParaEscalao(escaloes.masculinos, escalaoIdMasculinos, camposMasculinos);
    processaCamposParaEscalao(escaloes.femininos, escalaoIdFemininos, camposFemininos);
    
    if(!errors.isEmpty()){
        const oldData = {
            torneioId: torneioId,
            designacao: designacao,
            localidade: localidade,
            ano: ano,
            camposMasculinos: camposMasculinos,
            escalaoIdMasculinos: escalaoIdMasculinos,
            camposFemininos: camposFemininos,
            escalaoIdFemininos: escalaoIdFemininos
        }
        res.render('admin/editarTorneio', {validationErrors: errors.array({ onlyFirstError: true }), torneio: oldData, escaloes: escaloes});
    } else {

        let transaction;
        try {

            transaction = await sequelize.transaction();

            let torneioToUpdate = await Torneio.findByPk(torneioId, {transaction});

            await torneioToUpdate.update({
                designacao: designacao,
                localidade: localidade,
                ano: ano
            }, {transaction});
            
            await processaUpdateCampos(transaction, torneioId, camposMasculinos, escalaoIdMasculinos);
            await processaUpdateCampos(transaction, torneioId, camposFemininos, escalaoIdFemininos);

            await transaction.commit();

        } catch(err) {
            console.log(err);
            if (err) await transaction.rollback();
        }

        if(transaction.finished === 'commit'){
            req.flash('success', 'Torneio actualizado com sucesso.');
            res.redirect('/admin/torneios');
        } else {
            req.flash('error', 'Não foi possível actualizar o torneio.');
            res.redirect('/admin/torneios');
        }
    }
}

exports.deleteTorneio = (req, res, next) => {
    const torneioId = req.body.id;

    Torneio.destroy({where: {torneioId: torneioId}, limit: 1})
        .then(result => {
            if(result){
                res.status(200).json({success: true});
            } else {
                res.status(200).json({success: false});
            }
        })
        .catch(err => { 
            res.status(200).json({success: false});
        });
}