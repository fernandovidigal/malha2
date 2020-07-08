const Escaloes = require('../../models/Escaloes');
const { validationResult } = require('express-validator');
const dbFunctions = require('../../helpers/DBFunctions');

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
    try {
        const designacao = req.body.designacao.trim();
        const sexo = parseInt(req.body.sexo);
        const errors = validationResult(req);
        
        const oldData = {
            designacao: designacao,
            sexo: sexo
        }

        if(!errors.isEmpty()){
            req.breadcrumbs('Adicionar Escalão', '/admin/adicionarEscalao');
            res.render('admin/adicionarEscalao', {validationErrors: errors.array(), escalao: oldData, breadcrumbs: req.breadcrumbs()});
        } else {
            const [escalao, created] = await Escaloes.findOrCreate({
                                                where: {
                                                    designacao: designacao,
                                                    sexo: sexo
                                                }
                                            });
            if(!created){
                const errors = [{
                    msg: 'Escalão já existe',
                    param: 'designacao'
                }];
                req.breadcrumbs('Adicionar Escalão', '/admin/adicionarEscalao');
                return res.render('admin/adicionarEscalao', {validationErrors: errors, escalao: oldData, breadcrumbs: req.breadcrumbs()});
            }

            req.flash('success', `Escalão ${escalao.designacao} adicionado com sucesso.`);
            res.redirect('/admin/escaloes');
        }
    } catch(err) {
        console.log(err);
        req.flash('error', 'Não foi possível adicionar o escalão.');
        res.redirect('/admin/escaloes');
    }
}

exports.updateEscalao = async (req, res) => {
    try {
        const escalaoId = req.params.id;
        const designacao = req.body.designacao.trim();
        const sexo = req.body.sexo;
        const errors = validationResult(req);
        
        const oldData = {
            escalaoId: escalaoId,
            designacao: designacao,
            sexo: sexo
        }
    
        if(!errors.isEmpty()){
            req.breadcrumbs('Editar Escalão', '/admin/editarEscalao');
            res.render('admin/editarEscalao', {validationErrors: errors.array(), escalao: oldData, breadcrumbs: req.breadcrumbs()});
        } else {
            const _escalao = Escaloes.findByPk(escalaoId);
            const _existeEscalao = Escaloes.findOne({
                                    where: {
                                        designacao: designacao,
                                        sexo: sexo
                                    }, 
                                    raw: true    
                                });
            const [escalao, existeEscalao] = await Promise.all([_escalao, _existeEscalao]);

            if(existeEscalao){
                const errors = [{
                    msg: 'Escalão já existe.',
                    param: 'designacao'
                }];

                req.breadcrumbs('Editar Escalão', '/admin/editarEscalao');
                return res.render('admin/editarEscalao', {validationErrors: errors, escalao: oldData, breadcrumbs: req.breadcrumbs()});
            }

            escalao.designacao = designacao;
            escalao.sexo = sexo;
            const result = await escalao.save();

            if(!result){
                throw new Error();
            }

            req.flash('success', 'Escalão actualizado com sucesso.');
            res.redirect('/admin/escaloes');
        }
    } catch(err) {
        console.log(err);
        req.flash('error', 'Não foi possível actualizar o escalão.');
        res.redirect('/admin/escaloes');
    }
}

exports.deleteEscalao = (req, res) => {
    const escalaoId = parseInt(req.body.id);

    if(req.user.level == 5 || req.user.level == 10){
        Escaloes.destroy({where: {escalaoId: escalaoId}, limit: 1})
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
    } else {
        res.status(200).json({success: false});
    }
    
}