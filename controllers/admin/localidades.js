const Localidade = require('../../models/Localidade');
const { validationResult } = require('express-validator/check');
const util = require('../../helpers/util');

exports.getAllLocalidades = (req, res, next) => {
    Localidade.findAll({
        order: ['nome'],
        raw: true
    })
    .then(localidades => {
        util.sort(localidades);
        res.render('admin/localidades', {localidades: localidades});
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados das localidades!');
        res.redirect('/admin/localidades');
    });
}

exports.getLocalidade = (req, res, next) => {
    const localidadeId = req.params.id;
    
    Localidade.findByPk(localidadeId)
    .then(localidade => {
        if(localidade){
            res.render('admin/editarLocalidade', {localidade: localidade});
        } else {
            req.flash('error', 'Localidade inválida');
            res.redirect('/admin/localidades');
        }
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados da localidade');
        res.redirect('/admin/localidades');
    });
}

exports.createLocalidade = (req, res, next) => {
    const localidade = req.body.localidade;
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        const oldData = {
            localidade: localidade
        }
        res.render('admin/adicionarLocalidade', {validationErrors: errors.array(), oldData: oldData});
    } else {
        Localidade.create({
            nome: localidade
        })
        .then(localidade => {
            req.flash('success', `Localidade: ${localidade.nome} adicionada com sucesso`);
            res.redirect('/admin/localidades');
        })
        .catch(err => {
            req.flash('error', err.errors[0].message);
            res.redirect('/admin/localidades');
        });
    }
}