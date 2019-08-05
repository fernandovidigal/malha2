const Sequelize = require('sequelize');
const sequelize = require('../../helpers/database');
const Torneio = require('../../models/Torneios');
const Escaloes = require('../../models/Escaloes');
const Campos = require('../../models/Campos');
const { validationResult } = require('express-validator/check');

const Op = Sequelize.Op;

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

function getAllEscaloesComCampos(torneioId){
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

function getAllEscaloesSemCampos(torneioId, listaEscaloesComCampo){
    return Escaloes.findAll({
        where: {
            escalaoId: {
                [Op.notIn]: listaEscaloesComCampo
            }
        },
        raw: true
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
        const listaEscaloes = getAllEscaloesComCampos(torneioId);
        const torneio = getTorneio(torneioId);
        let escaloes = [];
        const listaEscaloesComCampo = [];

        Promise.all([listaEscaloes, torneio])
        .then(async ([_escaloes, _torneio]) => { 
            for(const escalao of _escaloes){
                const _escalao = {
                    escalaoId: escalao.escalaoId,
                    designacao: escalao.designacao,
                    sexo: escalao.sexo,
                    campos: escalao.campos[0].numCampos
                }
                escaloes.push(_escalao);
                listaEscaloesComCampo.push(escalao.escalaoId);
            }
            const escaloesSemCampos = await getAllEscaloesSemCampos(torneioId, listaEscaloesComCampo);
            // Junta as duas Arrays (com e sem campos definidos)
            escaloes = escaloes.concat(escaloesSemCampos);

            console.log(escaloes);

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
    .then( escaloes => {
        res.render('admin/adicionarTorneio', {torneio: {}, escaloes: escaloes});
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não é possivel adicionar torneio. Não foi possível aceder à lista de escalões.');
        res.redirect('/admin/torneios');
    });
}

async function processaCriacaoCampos(transaction, torneioId, listaEscaloes){
    for(const escalao of listaEscaloes){
        if(escalao.campos > 0){
            await Campos.create({
                torneioId: torneioId,
                escalaoId: escalao.escalaoId,
                numCampos: escalao.campos
            }, {transaction});
        }
    }
}

exports.createTorneio = async (req, res, next) => {
    const designacao = req.body.designacao.trim();
    const localidade = req.body.localidade.trim();
    const ano = req.body.ano.trim();
    const errors = validationResult(req);
    let listaCampos =  req.body.numCampos;
    let listaCamposId = req.body.escalaoId;


    // Processa todos os escalões
    const listaEscaloes = await getAllEscaloes();
    for(const escalao of listaEscaloes){
        const numCampos = req.body[escalao.escalaoId];
        if(Math.log2(parseInt(numCampos)) % 1 === 0){
            escalao.campos = parseInt(numCampos);
        } else {
            escalao.campos = 0;
        }
    }

    if(!errors.isEmpty()){
        const oldData = {
            designacao: designacao,
            localidade: localidade,
            ano: ano
        }
        res.render('admin/adicionarTorneio', {validationErrors: errors.array({ onlyFirstError: true }), escaloes: listaEscaloes, torneio: oldData});
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

            await processaCriacaoCampos(transaction, torneioCriadoId, listaEscaloes);
            //await processaCriacaoCampos(transaction, torneioCriadoId, listaCampos, listaCamposId);
            //await processaCriacaoCampos(transaction, torneioCriadoId, camposFemininos, escalaoIdFemininos);

            await transaction.commit();

        } catch(err) {
            console.log(err);
            if(err) await transaction.rollback();
        }

        if(transaction.finished === 'commit' && torneioCriadoId != 0){
            // Escolheu adicionar e activar o torneios
            if(req.body.adicionar_activar){
                if(await setTorneioActivo(torneioCriadoId)){
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
                        if(await setTorneioActivo(torneioCriadoId)){
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

async function processaUpdateCampos(transaction, torneioId, listaCampos, listaIds){
    let i = 0;
    for(const escalao of listaCampos){
        let escalaoCamposToUpdate = await Campos.findOne({
            where: {
                torneioId: torneioId,
                escalaoId: listaIds[i]
            }
        }, {transaction});
        
        if(escalaoCamposToUpdate){
            await escalaoCamposToUpdate.update({numCampos: listaCampos[i]}, {transaction});
        } else {
            await Campos.create({
                torneioId: torneioId,
                escalaoId: listaIds[i],
                numCampos: listaCampos[i]
            }, {transaction});
        }

        i++;
    }
}

exports.updateTorneio = async (req, res, next) => {
    const torneioId = req.params.id;
    const designacao = req.body.designacao.trim();
    const localidade = req.body.localidade.trim();
    const ano = req.body.ano.trim();
    const errors = validationResult(req);
    let listaCampos =  req.body.numCampos;
    let listaCamposId = req.body.escalaoId;

    // Valida número de campos introduzidos
    listaCampos = listaCampos.map(campo => (campo != '' && !isNaN(campo)) ? parseInt(campo) : 0);
    listaCamposId = listaCamposId.map(id => parseInt(id));
    
    // Processa todos os escalões
    const listaEscaloes = await getAllEscaloes();
    for(const escalao of listaEscaloes){
        const i = listaCamposId.indexOf(escalao.escalaoId);
        escalao.campos = listaCampos[i];
    }
    
    if(!errors.isEmpty()){
        const oldData = {
            torneioId: torneioId,
            designacao: designacao,
            localidade: localidade,
            ano: ano
        }
        res.render('admin/editarTorneio', {validationErrors: errors.array({ onlyFirstError: true }), torneio: oldData, escaloes: listaEscaloes});
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
            
            await processaUpdateCampos(transaction, torneioId, listaCampos, listaCamposId);

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