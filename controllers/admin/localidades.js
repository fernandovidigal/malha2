const Localidade = require('../../models/Localidades');
const { validationResult } = require('express-validator');
const util = require('../../helpers/util');
const dbFunctions = require('../../helpers/DBFunctions');
const crypto = require('crypto');
const axios = require('axios');
 
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
    try {
        const localidade = req.body.localidade.trim();
        const errors = validationResult(req);

        const oldData = {
            nome: localidade
        }

        if(!errors.isEmpty()){
            req.breadcrumbs('Adicionar Localidade', '/admin/adicionarLocalidade');
            res.render('admin/adicionarLocalidade', {validationErrors: errors.array({ onlyFirstError: true }), localidade: oldData, breadcrumbs: req.breadcrumbs()});
        } else {
            const syncAppHash = crypto.createHash('sha512').update(localidade.toUpperCase()).digest('hex');
            const [localidadeModel, created] = await Localidade.findOrCreate({
                where: { syncApp: syncAppHash },
                defaults: {
                    nome: localidade
                }
            });

            if(created){
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
                }
                
                req.flash('success', `${localidadeModel.nome} adicionada com sucesso`);
                res.redirect('/admin/localidades');
            } else {
                const errors = [{
                    msg: 'Localidade já existe',
                    param: 'localidade'
                }];
                req.breadcrumbs('Adicionar Localidade', '/admin/adicionarLocalidade');
                res.render('admin/adicionarLocalidade', {validationErrors: errors, localidade: oldData, breadcrumbs: req.breadcrumbs()});
            }
        }
    } catch(err) {
        req.flash('error', 'Não foi possível adicionar a localidade');
        res.redirect('/admin/localidades');
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
            const updatedSyncAppHash = crypto.createHash('sha512').update(nomeLocalidade.toUpperCase()).digest('hex');

            await Localidade.update({
                nome: nomeLocalidade,
                syncApp: updatedSyncAppHash
            }, {
                where: {
                    localidadeId: localidadeId
                }
            });

            const localidade = await Localidade.findByPk(localidadeId);

            if(req.session.sync){
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
            }
            
            req.flash('success', 'Localidade actualizada com sucesso');
            res.redirect('/admin/localidades');
        }
    } catch(err) {
        if(err.name == 'SequelizeUniqueConstraintError'){
            const errors = [{
                msg: 'Localidade já existe',
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

    if(req.user.level == 5 || req.user.level == 10){
        const localidade = await Localidade.findByPk(localidadeId);
        Localidade.destroy({where: {localidadeId: localidadeId}, limit: 1})
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
        });
    } else {
        res.status(200).json({ success: false });
    }
}