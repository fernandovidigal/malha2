const Escaloes = require('../../models/Escaloes');
const { validationResult } = require('express-validator');
const dbFunctions = require('../../helpers/DBFunctions');
const crypto = require('crypto');
const axios = require('axios');
const Sequelize = require('sequelize');
const db = require('../../helpers/database');
const { syncEscaloes } = require('../../helpers/sync/escaloes');

exports.getAllEscaloes = async (req, res) => {
    try {
        const _escaloes = dbFunctions.getAllEscaloes();
        const _listaEquipasComEscalao = dbFunctions.getAllEscaloesComEquipas();
        
        const [escaloes, listaEquipasComEscalao] = await Promise.all([_escaloes, _listaEquipasComEscalao]);

        if(escaloes.length > 0){
            escaloes.forEach(escalao => {
                const escalaoIndex = listaEquipasComEscalao.find(_escalao => _escalao.escalaoId == escalao.escalaoId);
                escalao.eliminavel = (!escalaoIndex) ? true : false;
            });
        }

        res.render('admin/escaloes', {escaloes: escaloes, filtro: -1, breadcrumbs: req.breadcrumbs()});

    } catch(err){
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados dos escalões.');
        res.redirect('/admin/escaloes');
    }
}

exports.getEscalao = async (req, res) => {
    try {
        const escalaoId = parseInt(req.params.id);

        const escalao = await Escaloes.findByPk(escalaoId);

        if(!escalao){
            req.flash('error', 'Escalão não existe.');
            return res.redirect('/admin/escaloes');
        }

        req.breadcrumbs('Editar Escalão', '/admin/editarEscalao');
        res.render('admin/editarEscalao', {escalao: escalao, breadcrumbs: req.breadcrumbs()});
    } catch(err) {
        console.log(err);
        req.flash('error', 'Não foi possível aceder ao escalão.');
        res.redirect('/admin/escaloes');
    }
}

exports.getEscalaoBySexo = async (req, res) => {
    try {
        const genero = req.params.sexo == 'F' ? 0 : 1;

        const _escaloes = dbFunctions.getAllEscaloes({sexo: genero});
        const _listaEquipasComEscalao = dbFunctions.getAllEscaloesComEquipas();

        const [escaloes, listaEquipasComEscalao] = await Promise.all([_escaloes, _listaEquipasComEscalao]);
        
        escaloes.forEach(escalao => {
            const escalaoIndex = listaEquipasComEscalao.find(el => el.escalaoId == escalao.escalaoId);
            escalao.eliminavel = (!escalaoIndex) ? true : false;
        });

        res.render('admin/escaloes', {escaloes: escaloes, filtro: genero, breadcrumbs: req.breadcrumbs()});

    } catch(err) {
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados dos escalões.');
        res.redirect('/admin/escaloes');
    }
}

exports.createEscalao = async (req, res) => {
    const designacao = req.body.designacao.trim();
    const sexo = parseInt(req.body.sexo);
    const errors = validationResult(req);
    
    const oldData = {
        designacao: designacao,
        sexo: sexo
    }

    try {
        if(!errors.isEmpty()){
            req.breadcrumbs('Adicionar Escalão', '/admin/adicionarEscalao');
            res.render('admin/adicionarEscalao', {validationErrors: errors.array(), escalao: oldData, breadcrumbs: req.breadcrumbs()});
        } else {
            const escalaoToHash = designacao + sexo;
            const hash = crypto.createHash('sha512').update(escalaoToHash.toUpperCase()).digest('hex');

            if(req.session.activeConnection){
                const response = await axios.post(`${req.session.syncUrl}escaloes/create.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
                    designacao: designacao,
                    sexo: sexo,
                    hash: hash
                });

                if(response.data.sucesso && (response.data.uuid || response.data.escalao)){
                    const escalaoModel = await Escaloes.create({
                        designacao: designacao,
                        sexo: sexo,
                        hash: hash,
                        uuid: response.data.uuid || response.data.escalao.uuid
                    });

                    req.flash('success', `Escalão ${escalaoModel.designacao} adicionado com sucesso.`);
                    res.redirect('/admin/escaloes');
                } else {
                    throw new Error();
                } 
            }
        }
    } catch(err) {
        if(err instanceof Sequelize.UniqueConstraintError){
            const errors = [{
                msg: 'Escalão já existe',
                param: 'designacao'
            }];
            req.breadcrumbs('Adicionar Escalão', '/admin/adicionarEscalao');
            return res.render('admin/adicionarEscalao', {validationErrors: errors, escalao: oldData, breadcrumbs: req.breadcrumbs()});
        } else {
            req.flash('error', 'Não foi possível adicionar o escalão.');
            res.redirect('/admin/escaloes');
        }
    }
}

exports.updateEscalao = async (req, res) => {
    const escalaoId = req.params.id;
    const designacao = req.body.designacao.trim();
    const sexo = req.body.sexo;
    const errors = validationResult(req);
    
    const oldData = {
        escalaoId: escalaoId,
        designacao: designacao,
        sexo: sexo
    }

    try {
        if(!errors.isEmpty()){
            req.breadcrumbs('Editar Escalão', '/admin/editarEscalao');
            res.render('admin/editarEscalao', {validationErrors: errors.array(), escalao: oldData, breadcrumbs: req.breadcrumbs()});
        } else {
            if(req.session.activeConnection){
                const escalaoToHash = designacao + sexo;
                const hash = crypto.createHash('sha512').update(escalaoToHash.toUpperCase()).digest('hex');
                const transaction = await db.transaction();

                try {
                    const escalao = Escaloes.findByPk(escalaoId);

                    await Escaloes.update({
                        designacao: designacao,
                        sexo: sexo,
                        hash: hash
                    }, {
                        where: {
                            escalaoId: escalaoId
                        },
                        transaction: transaction
                    });

                    const response = await axios.post(`${req.session.syncUrl}escaloes/update.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
                        uuid: escalao.uuid,
                        designacao: designacao,
                        sexo: sexo,
                        hash: hash
                    });

                    if(response.data.sucesso){
                        await transaction.commit();
                        req.flash('success', 'Escalão actualizado com sucesso.');
                        res.redirect('/admin/escaloes');
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
                msg: 'O Escalão já existe.',
                param: 'designacao'
            }];

            req.breadcrumbs('Editar Escalão', '/admin/editarEscalao');
            return res.render('admin/editarEscalao', {validationErrors: errors, escalao: oldData, breadcrumbs: req.breadcrumbs()});
        }
        req.flash('error', 'Não foi possível actualizar o escalão.');
        res.redirect('/admin/escaloes');
    }
}

exports.deleteEscalao = async (req, res) => {
    const escalaoId = parseInt(req.body.id);

    if(req.session.activeConnection && (req.user.level == 5 || req.user.level == 10)){
        try {
            const escalao = await Escaloes.findByPk(escalaoId);
            const response = await axios.post(`${req.session.syncUrl}escaloes/delete.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
                uuid: escalao.uuid
            });

            if(response.data.sucesso){
                await escalao.destroy();
            } else {
                throw new Error();
            }
            res.status(200).json({ success: true });
        } catch (error) {
            throw error;
        }
    } else {
        res.status(200).json({success: false});
    }
}

exports.sincronizarEscaloes = async (req, res) => {
    try {
      const url = req.session.syncUrl;
      await syncEscaloes(url);
      req.flash("success", "Escalões sincronizados");
      return res.redirect("/admin/escaloes");
    } catch(error) {
      req.flash("error", "Não foi sincronizar os escalões");
      res.redirect("/admin/escaloes");
    }
}