const Escaloes = require('../../models/Escaloes');
const { validationResult } = require('express-validator/check');
const dbFunctions = require('../../helpers/DBFunctions');

exports.getAllEscaloes = async (req, res, next) => {
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

exports.getEscalao = (req, res, next) => {
    const escalaoId = req.params.id;

    Escaloes.findByPk(escalaoId)
    .then(escalao => {
        if(escalao){
            req.breadcrumbs('Editar Escalão', '/admin/editarEscalao');
            res.render('admin/editarEscalao', {escalao: escalao, breadcrumbs: req.breadcrumbs()});
        } else {
            req.flash('error', 'Escalão não existe.');
            res.redirect('/admin/escaloes');
        }
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível aceder ao escalão.');
        res.redirect('/admin/escaloes');
    })
}

exports.getEscalaoBySexo = (req, res, next) => {
    const genero = req.params.sexo;
    let sexo = 1;
    if(genero == 'F'){
        sexo = 0;
    }

    Escaloes.findAll({
        where: {sexo: sexo},
        raw: true
    })
    .then(async escaloes => {
        if(escaloes.length > 0){
            const listaEquipasComEscalao = await dbFunctions.getAllEscaloesComEquipas();
            escaloes.forEach(escalao => {
                const escalaoIndex = listaEquipasComEscalao.find(_escalao => _escalao.escalaoId == escalao.escalaoId);
                escalao.eliminavel = (!escalaoIndex) ? true : false;
            });
        }
    
        res.render('admin/escaloes', {escaloes: escaloes, filtro: sexo, breadcrumbs: req.breadcrumbs()});
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados dos escalões.');
        res.redirect('/admin/escaloes');
    });
}

exports.createEscalao = (req, res, next) => {
    const designacao = req.body.designacao.trim();
    const sexo = req.body.sexo;
    const errors = validationResult(req);
    
    const oldData = {
        designacao: designacao,
        sexo: sexo
    }

    if(!errors.isEmpty()){
        req.breadcrumbs('Adicionar Escalão', '/admin/adicionarEscalao');
        res.render('admin/adicionarEscalao', {validationErrors: errors.array(), escalao: oldData, breadcrumbs: req.breadcrumbs()});
    } else {
        Escaloes.findOrCreate({
            where: {
                designacao: designacao,
                sexo: sexo
            }
        })
        .then(([escalao, created]) => {
            if(created){
                req.flash('success', 'Escalão adicionado com sucesso.');
                res.redirect('/admin/escaloes');
            } else {
                const errors = [{
                    msg: 'Escalão já existe.'
                }]
                res.render('admin/adicionarEscalao', {validationErrors: errors, escalao: oldData});
            }
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Não foi possível adicionar o escalão.');
            res.redirect('/admin/escaloes');
        });
    }
}

exports.updateEscalao = (req, res, next) => {
    const escalaoId = req.params.id;
    const designacao = req.body.designacao.trim();
    const sexo = req.body.sexo;
    const errors = validationResult(req);
    
    const escalao = {
        escalaoId: escalaoId,
        designacao: designacao,
        sexo: sexo
    }

    if(!errors.isEmpty()){
        req.breadcrumbs('Editar Escalão', '/admin/editarEscalao');
        res.render('admin/editarEscalao', {validationErrors: errors.array(), escalao: escalao, breadcrumbs: req.breadcrumbs()});
    } else {
        Escaloes.findOne({
            where: {
                designacao: designacao,
                sexo: sexo
            }, raw: true    
        }).then(escaloes => {
            // Existe escalão com a mesma designação e sexo
            if(escaloes != null){
                const errors = [{
                    msg: 'Escalão já existe.'
                }]
                res.render('admin/editarEscalao', {validationErrors: errors, escalao: escalao, breadcrumbs: req.breadcrumbs()});
            } else {
                // Não existe escalão com a mesma designação e sexo
                // Actualiza-se o escalão
                Escaloes.findByPk(escalaoId)
                .then(escalao => {
                    escalao.designacao = designacao;
                    escalao.sexo = sexo;
                    escalao.save()
                    .then(result => {
                        if(result){
                            req.flash('success', 'Escalão actualizado com sucesso.');
                            res.redirect('/admin/escaloes');
                        } else {
                            req.flash('error', 'Não foi possível actualizar o escalão.');
                            res.redirect('/admin/escaloes');
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        req.flash('error', 'Não foi possível actualizar o escalão.');
                        res.redirect('/admin/escaloes');
                    });
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error', 'Não foi possível obter dados do escalão.');
                    res.redirect('/admin/escaloes');
                });
            }
        });
    }
}

exports.deleteEscalao = (req, res, next) => {
    const escalaoId = parseInt(req.body.id);

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
}