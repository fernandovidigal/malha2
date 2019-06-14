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

exports.createEscalao = (req, res, next) => {
    const designacao = req.body.designacao.trim();
    const sexo = req.body.sexo;
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        const oldData = {
            designacao: designacao,
            sexo: sexo
        }
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
                req.flash('error', 'Escalão já existente.');
                res.redirect('/admin/escaloes');
            }
        })
        .catch(err => {
            console.log(err);
        });
    }
}