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

exports.getTorneio = async (req, res, next) => {
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
                    campos: escalao.campos[0].numCampos,
                    minEquipas: escalao.campos[0].minEquipas,
                    maxEquipas: escalao.campos[0].maxEquipas
                }
                escaloes.push(_escalao);
                listaEscaloesComCampo.push(escalao.escalaoId);
            }
            const escaloesSemCampos = await getAllEscaloesSemCampos(torneioId, listaEscaloesComCampo);

            // Junta as duas Arrays (com e sem campos definidos)
            escaloes = escaloes.concat(escaloesSemCampos);

            // Ordena a lista de Escalões pelo escalão Id
            escaloes.sort((a,b) => (a.escalaoId > b.escalaoId) ? 1 : -1);

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
        if(escalao.campos > 0 && escalao.minEquipas > 0 && escalao.maxEquipas > 0){
            await Campos.create({
                torneioId: torneioId,
                escalaoId: escalao.escalaoId,
                numCampos: escalao.campos,
                minEquipas: escalao.minEquipas,
                maxEquipas: escalao.maxEquipas
            }, {transaction});
        }
    }
}

exports.createTorneio = async (req, res, next) => {
    const designacao = req.body.designacao.trim();
    const localidade = req.body.localidade.trim();
    const ano = req.body.ano.trim();
    const errors = validationResult(req).array({ onlyFirstError: true });

    // Processa todos os escalões
    const listaEscaloes = await getAllEscaloes();
    for(const escalao of listaEscaloes){
        const numCampos = req.body[escalao.escalaoId];
        // Campos
        if(Math.log2(parseInt(numCampos)) % 1 === 0){
            escalao.campos = parseInt(numCampos);
        } else {
            escalao.campos = 0;
        }

        //Min Max Equipas
        const minEquipas = parseInt(req.body[(escalao.escalaoId * 100) + 1]) || 0;
        const maxEquipas = parseInt(req.body[(escalao.escalaoId * 100) + 2]) || 0;
        escalao.minEquipas = minEquipas;
        escalao.maxEquipas = maxEquipas;

        if(escalao.campos > 0){
            if(minEquipas <= 0 && maxEquipas <= 0){
                errors.push({
                    msg: 'Escalão: <strong>' + escalao.designacao + ' (' + ((escalao.sexo == 1) ? 'Masculino' : 'Feminino') + ')</strong> - Deve indicar o número mínimo e máximo de equipas por campo'
                });
            } else if(minEquipas <= 0){
                errors.push({
                    msg: 'Escalão: <strong>' + escalao.designacao + ' (' + ((escalao.sexo == 1) ? 'Masculino' : 'Feminino') + ')</strong> - Deve indicar o número mínimo de equipas por campo'
                });
            } else if(maxEquipas <= 0){
                errors.push({
                    msg: 'Escalão: <strong>' + escalao.designacao + ' (' + ((escalao.sexo == 1) ? 'Masculino' : 'Feminino') + ')</strong> - Deve indicar o número máximo de equipas por campo'
                });
            } else if(maxEquipas < minEquipas){
                errors.push({
                    msg: 'Escalão: <strong>' + escalao.designacao + ' (' + ((escalao.sexo == 1) ? 'Masculino' : 'Feminino') + ')</strong> - O número máximo de equipas não pode ser inferior ao número mínimo de equipas'
                });
            } else if(minEquipas < 2){
                errors.push({
                    msg: 'Escalão: <strong>' + escalao.designacao + ' (' + ((escalao.sexo == 1) ? 'Masculino' : 'Feminino') + ')</strong> - O número mínimo de equipas por campo deve ser 2 ou mais'
                });
            }
        } else {
            if(minEquipas > 0 || maxEquipas > 0){
                errors.push({
                    msg: 'Escalão: <strong>' + escalao.designacao + ' (' + ((escalao.sexo == 1) ? 'Masculino' : 'Feminino') + ')</strong> - Deve selecionar o número de campos'
                }); 
            }
        }
    }

    if(errors.length > 0){
        const oldData = {
            designacao: designacao,
            localidade: localidade,
            ano: ano
        }
        res.render('admin/adicionarTorneio', {validationErrors: errors, escaloes: listaEscaloes, torneio: oldData});
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

async function processaUpdateCampos(transaction, torneioId, listaEscaloes){
    for(const escalao of listaEscaloes){
        let escalaoCamposToUpdate = await Campos.findOne({
            where: {
                torneioId: torneioId,
                escalaoId: escalao.escalaoId
            }
        }, {transaction});
        
        if(escalaoCamposToUpdate){
            if(escalao.campos == 0){
                await escalaoCamposToUpdate.destroy({transaction});
            } else {
                await escalaoCamposToUpdate.update({
                    numCampos: escalao.campos,
                    minEquipas: escalao.minEquipas,
                    maxEquipas: escalao.maxEquipas
                }, {transaction});
            }
        } else {
            await Campos.create({
                torneioId: torneioId,
                escalaoId: escalao.escalaoId,
                numCampos: escalao.campos,
                minEquipas: escalao.minEquipas,
                maxEquipas: escalao.maxEquipas
            }, {transaction});
        }
    }
}

exports.updateTorneio = async (req, res, next) => {
    const torneioId = req.params.id;
    const designacao = req.body.designacao.trim();
    const localidade = req.body.localidade.trim();
    const ano = req.body.ano.trim();
    const errors = validationResult(req).array({ onlyFirstError: true });
    
    // Processa todos os escalões
    const listaEscaloes = await getAllEscaloes();
    for(const escalao of listaEscaloes){
        const numCampos = req.body[escalao.escalaoId];
        // Campos
        if(Math.log2(parseInt(numCampos)) % 1 === 0){
            escalao.campos = parseInt(numCampos);
        } else {
            escalao.campos = 0;
        }

        //Min Max Equipas
        const minEquipas = parseInt(req.body[(escalao.escalaoId * 100) + 1]) || 0;
        const maxEquipas = parseInt(req.body[(escalao.escalaoId * 100) + 2]) || 0;
        escalao.minEquipas = minEquipas;
        escalao.maxEquipas = maxEquipas;

        if(escalao.campos > 0){
            if(minEquipas <= 0 && maxEquipas <= 0){
                errors.push({
                    msg: 'Escalão: <strong>' + escalao.designacao + ' (' + ((escalao.sexo == 1) ? 'Masculino' : 'Feminino') + ')</strong> - Deve indicar o número mínimo e máximo de equipas por campo'
                });
            } else if(minEquipas <= 0){
                errors.push({
                    msg: 'Escalão: <strong>' + escalao.designacao + ' (' + ((escalao.sexo == 1) ? 'Masculino' : 'Feminino') + ')</strong> - Deve indicar o número mínimo de equipas por campo'
                });
            } else if(maxEquipas <= 0){
                errors.push({
                    msg: 'Escalão: <strong>' + escalao.designacao + ' (' + ((escalao.sexo == 1) ? 'Masculino' : 'Feminino') + ')</strong> - Deve indicar o número máximo de equipas por campo'
                });
            } else if(maxEquipas < minEquipas){
                errors.push({
                    msg: 'Escalão: <strong>' + escalao.designacao + ' (' + ((escalao.sexo == 1) ? 'Masculino' : 'Feminino') + ')</strong> - O número máximo de equipas não pode ser inferior ao número mínimo de equipas'
                });
            } else if(minEquipas < 2){
                errors.push({
                    msg: 'Escalão: <strong>' + escalao.designacao + ' (' + ((escalao.sexo == 1) ? 'Masculino' : 'Feminino') + ')</strong> - O número mínimo de equipas por campo deve ser 2 ou mais'
                });
            }
        } else {
            if(minEquipas > 0 || maxEquipas > 0){
                errors.push({
                    msg: 'Escalão: <strong>' + escalao.designacao + ' (' + ((escalao.sexo == 1) ? 'Masculino' : 'Feminino') + ')</strong> - Deve selecionar o número de campos'
                }); 
            }
        }
    }
    
    if(errors.length > 0){
        const oldData = {
            torneioId: torneioId,
            designacao: designacao,
            localidade: localidade,
            ano: ano
        }
        res.render('admin/editarTorneio', {validationErrors: errors, torneio: oldData, escaloes: listaEscaloes});
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
            
            await processaUpdateCampos(transaction, torneioId, listaEscaloes);

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