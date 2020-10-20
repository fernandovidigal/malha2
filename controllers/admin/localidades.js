const Localidade = require('../../models/Localidades');
const { validationResult } = require('express-validator');
const util = require('../../helpers/util');
const dbFunctions = require('../../helpers/DBFunctions');
const crypto = require('crypto');
const axios = require('axios');
const Sequelize = require('sequelize');
const db = require('../../helpers/database');
const { syncLocalidades } = require('../../helpers/sync/localidades');
 
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

            if(req.session.activeConnection){
                const response = await axios.post(`${req.session.syncUrl}localidades/create.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
                    nome: localidade,
                    hash: hash
                });

                // Pode ser retornado uma localidade (caso exista) ou o uuid (caso seja inserido)
                if(response.data.sucesso && (response.data.uuid || response.data.localidade)){
                    const localidadeModel = await Localidade.create({
                        nome: localidade,
                        hash: hash,
                        uuid: response.data.uuid || response.data.localidade.uuid
                    });
                    req.flash('success', `${localidadeModel.nome} adicionada com sucesso`);
                    res.redirect('/admin/localidades');
                } else {
                    throw new Error();
                } 
            } else {
                throw new Error();
            }
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
            if(req.session.activeConnection){
                const hash = crypto.createHash('sha512').update(nomeLocalidade.toUpperCase()).digest('hex');
                const transaction = await db.transaction();
                try {
                    const localidade = await Localidade.findByPk(localidadeId);

                    await Localidade.update({
                        nome: nomeLocalidade,
                        hash: hash,
                    }, {
                        where: {
                            localidadeId: localidadeId
                        },
                        transaction: transaction
                    });

                    const response = await axios.post(`${req.session.syncUrl}localidades/update.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
                        uuid: localidade.uuid,
                        nome: nomeLocalidade,
                        hash: hash
                    });

                    if(response.data.sucesso){
                        await transaction.commit();
                        req.flash('success', 'Localidade actualizada com sucesso');
                        res.redirect('/admin/localidades');
                    } else {
                        throw new Error();
                    }
                } catch (error) {
                    await transaction.rollback();
                    throw error;
                }    
            } else {
                throw new Error();
            }
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

    if(req.session.activeConnection && (req.user.level == 5 || req.user.level == 10)){
        try {
            const localidade = await Localidade.findByPk(localidadeId);
            const response = await axios.post(`${req.session.syncUrl}localidades/delete.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
                uuid: localidade.uuid
            });

            if(response.data.sucesso){
                await localidade.destroy();
            } else {
                throw new Error();
            }

            res.status(200).json({ success: true });
        } catch (error) {
            throw error;
        }
    } else {
        res.status(200).json({ success: false });
    }
}

exports.sincronizarLocalidades = async (req, res) => {
    try {
      const url = req.session.syncUrl;
      await syncLocalidades(url);
      req.flash("success", "Localidades sincronizadas");
      return res.redirect("/admin/localidades");
    } catch(error) {
      req.flash("error", "Não foi sincronizar as localidades");
      res.redirect("/admin/localidades");
    }
}