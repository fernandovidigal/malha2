const Localidade = require('../../models/Localidades');
const SyncMessages = require('../../models/SyncMessages');
const { validationResult } = require('express-validator');
const util = require('../../helpers/util');
const dbFunctions = require('../../helpers/DBFunctions');
const crypto = require('crypto');
const axios = require('axios');
const Sequelize = require('sequelize');
const db = require('../../helpers/database');
 
exports.getAllLocalidades = async (req, res) => {
    try {
        const _localidades = dbFunctions.getAllLocalidades();
        const _listaLocalidadesComEquipas = dbFunctions.getLocalidadesComEquipas();

        const [localidades, localidadesComEquipas] = await Promise.all([_localidades, _listaLocalidadesComEquipas]);

        util.sort(localidades);

        if(localidades.length > 0){
            localidades.forEach(localidade => {
                const localidadeIndex = localidadesComEquipas.find(el => el.localidadeId == localidade.localidadeId);
                localidade.eliminavel = (!localidadeIndex) ? true : false;
            });
        }
        
        res.render('admin/localidades', {localidades: localidades, breadcrumbs: req.breadcrumbs()});

    } catch(err){
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados das localidades');
        res.redirect('/admin/localidades');
    }
}

exports.getLocalidade = async (req, res) => {
    try {
        const localidadeId = parseInt(req.params.id);

        const localidade = await dbFunctions.getLocalidade(localidadeId);
        if(localidade){
            req.breadcrumbs('Editar Localidade', '/admin/editarLocalidade');
            res.render('admin/editarLocalidade', {localidade: localidade, breadcrumbs: req.breadcrumbs()});
        } else {
            req.flash('error', 'Localidade não existe');
            res.redirect('/admin/localidades');
        }
    } catch(err) {
        req.flash('error', 'Não foi possível obter os dados da localidade');
        res.redirect('/admin/localidades');
    }
}

exports.createLocalidade = async (req, res) => {
    const localidade = req.body.localidade.trim();
    const errors = validationResult(req);

    const oldData = {
        nome: localidade
    }

    try {
        if(!errors.isEmpty()){
            req.breadcrumbs('Adicionar Localidade', '/admin/adicionarLocalidade');
            res.render('admin/adicionarLocalidade', {validationErrors: errors.array({ onlyFirstError: true }), localidade: oldData, breadcrumbs: req.breadcrumbs()});
        } else {
            const hash = crypto.createHash('sha512').update(localidade.toUpperCase()).digest('hex');
            const transaction = await db.transaction();
            const syncData = [`nome:${localidade}`];

            try {
                const localidadeModel = await Localidade.create({
                    nome: localidade,
                    hash: hash
                }, { transaction: transaction });

                await SyncMessages.create({
                    status: 'CREATED',
                    uuid: localidadeModel.uuid,
                    dataset: 'localidades',
                    columnvalue: JSON.stringify(syncData),
                    fieldhash: hash
                }, { transaction: transaction });

                await transaction.commit();

                req.flash('success', `${localidadeModel.nome} adicionada com sucesso`);
                res.redirect('/admin/localidades');
            } catch (error) {
                await transaction.rollback();
                throw error;
            }







            

            /*if(created){
                if(req.session.sync){
                    const responseWeb = await axios.post(`${req.session.syncUrl}localidades/createSync.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
                        nome: localidade,
                        syncApp: syncAppHash
                    });
                    if(responseWeb.data.sucesso){
                        await Localidade.update({
                            syncWeb: syncAppHash
                        }, {
                            where: {
                                localidadeId: localidadeModel.localidadeId,
                                syncApp: syncAppHash
                            }
                        });
                    }
                }*/
                
                
            /*} else {
                const errors = [{
                    msg: 'Localidade já existe',
                    param: 'localidade'
                }];
                req.breadcrumbs('Adicionar Localidade', '/admin/adicionarLocalidade');
                res.render('admin/adicionarLocalidade', {validationErrors: errors, localidade: oldData, breadcrumbs: req.breadcrumbs()});
            }*/
        }
    } catch(err) {
        if(err instanceof Sequelize.UniqueConstraintError){
            const errors = [{
                msg: 'Localidade já existe',
                param: 'localidade'
            }];
            req.breadcrumbs('Adicionar Localidade', '/admin/adicionarLocalidade');
            res.render('admin/adicionarLocalidade', {validationErrors: errors, localidade: oldData, breadcrumbs: req.breadcrumbs()});
        } else {
            req.flash('error', 'Não foi possível adicionar a localidade');
            res.redirect('/admin/localidades');
        }
    }
}

exports.updateLocalidade = async (req, res) => {
    const localidadeId = parseInt(req.params.id);
    const nomeLocalidade = req.body.localidade.trim();
    const oldData = {
        localidadeId: localidadeId,
        nome: nomeLocalidade
    }

    try {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            req.breadcrumbs('Editar Localidade', '/admin/editarLocalidade');
            res.render('admin/editarLocalidade', {validationErrors: errors.array({ onlyFirstError: true }), localidade: oldData, breadcrumbs: req.breadcrumbs()});
        } else {
            const hash = crypto.createHash('sha512').update(nomeLocalidade.toUpperCase()).digest('hex');
            const transaction = await db.transaction();
            const syncData = [`nome:${nomeLocalidade}`];

            try {
                const localidade = await Localidade.findByPk(localidadeId);

                localidade.nome = nomeLocalidade;
                localidade.hash = hash;

                await localidade.save({transaction: transaction});
                /*await Localidade.update({
                    nome: nomeLocalidade,
                    hash: hash,
                }, {
                    where: {
                        localidadeId: localidadeId
                    },
                    transaction: transaction
                });*/

                await SyncMessages.create({
                    status: 'UPDATED',
                    uuid: localidade.uuid,
                    dataset: 'localidades',
                    columnvalue: JSON.stringify(syncData),
                    fieldhash: hash
                }, { transaction: transaction });

                await transaction.commit();

                req.flash('success', 'Localidade actualizada com sucesso');
                res.redirect('/admin/localidades');

            } catch (error) {
                transaction.rollback();
                throw error;
            }

            

            //const localidade = await Localidade.findByPk(localidadeId);

            /*if(req.session.sync){
                const result = await axios.post(`${req.session.syncUrl}localidades/editSync.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
                    nome: nomeLocalidade,
                    syncApp: updatedSyncAppHash,
                    syncWeb: localidade.syncWeb
                });
                if(result.data.sucesso){
                    await Localidade.update({
                        syncWeb: updatedSyncAppHash
                    }, {
                        where: {
                            localidadeId: localidadeId,
                            syncApp: updatedSyncAppHash
                        }
                    });
                }
            }*/
        }
    } catch(err) {
        if(err instanceof Sequelize.UniqueConstraintError){
            const errors = [{
                msg: 'A Localidade já existe',
                param: 'localidade'
            }];
            req.breadcrumbs('Editar Localidade', '/admin/editarLocalidade');
            return res.render('admin/editarLocalidade', {validationErrors: errors, localidade: oldData, breadcrumbs: req.breadcrumbs()});
        }

        req.flash('error', 'Não foi possível actualizar a localidade');
        res.redirect('/admin/localidades');
    }
}

exports.deleteLocalidade = async (req, res) => {
    const localidadeId = parseInt(req.body.id);

    try{
        if(req.user.level == 5 || req.user.level == 10){
            const localidade = await Localidade.findByPk(localidadeId);

            const transaction = await db.transaction();

            try {
                await SyncMessages.create({
                    status: 'DELETED',
                    uuid: localidade.uuid,
                    dataset: 'localidades'
                }, { transaction: transaction });

                await localidade.destroy({ transaction: transaction });

                await transaction.commit();

                res.status(200).json({ success: true });

            } catch (error) {
                transaction.rollback();
                throw error;
            }
    
            // Não tem UID então ainda não está sincronizado
            /*if(localidade.uid == null){
                await Localidade.destroy({where: {localidadeId: localidadeId}, limit: 1});
                res.status(200).json({ success: true });
            } else {
                // Já têm UID então está sincronizado
                
                // Verifica se a sincronização está activa
                if(req.session.sync){

                } else {
                    await Localidade.update({
                        status: 'DELETED',
                    }, {
                        where: {
                            localidadeId: localidade.localidadeId
                        }
                    });
                    res.status(200).json({ success: true });
                }
            }*/
        }
    } catch(err){
        res.status(200).json({ success: false });
    }
    

        /*Localidade.destroy({where: {localidadeId: localidadeId}, limit: 1})
        .then(result => {
            if(result){
                if(req.session.sync){
                    const result = axios.post(`${req.session.syncUrl}localidades/deleteSync.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
                        nome: localidade.nome,
                        syncApp: localidade.syncApp
                    });
                }
                res.status(200).json({ success: true });
            } else {
                res.status(200).json({ success: false });
            }
        })
        .catch(err => { 
            res.status(200).json({ success: false });
        });*/
}