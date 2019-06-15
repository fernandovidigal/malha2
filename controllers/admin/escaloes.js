const Escaloes = require('../../models/Escaloes');
const { validationResult } = require('express-validator/check');

exports.getAllEscaloes = (req, res, next) => {
    Escaloes.findAll({
        order: [['sexo', 'DESC']]
    })
    .then(escaloes => {
        res.render('admin/escaloes', {escaloes: escaloes});
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados dos escalões!');
        res.redirect('/admin/escaloes');
    });
}

exports.getEscalao = (req, res, next) => {
    const escalaoId = req.params.id;

    Escaloes.findByPk(escalaoId)
    .then(escalao => {
        if(escalao){
            res.render('admin/editarEscalao', {escalao: escalao});
        } else {
            req.flash('error', 'Escalão não existente');
            res.redirect('/admin/escaloes');
        }
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível aceder ao escalão.');
        res.redirect('/admin/escaloes');
    })
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
        res.render('admin/adicionarEscalao', {validationErrors: errors.array(), escalao: oldData});
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
                    msg: 'Escalão já existente.'
                }]
                res.render('admin/adicionarEscalao', {validationErrors: errors, escalao: oldData});
            }
        })
        .catch(err => {
            console.log(err);
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
        res.render('admin/editarEscalao', {validationErrors: errors.array(), escalao: escalao});
    } else {
        Escaloes.findAll({
            where: {
                designacao: designacao,
                sexo: sexo
            }     
        }).then(escaloes => {
            // Existe escalão com a mesma designação e sexo
            if(escaloes.length > 0){
                const errors = [{
                    msg: 'Escalão já existente.'
                }]
                res.render('admin/editarEscalao', {validationErrors: errors, escalao: oldData});
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
        })
    }
}

exports.deleteEscalao = (req, res, next) => {
    const escalaoId = req.body.id;

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