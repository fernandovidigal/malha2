const Localidade = require('../../models/Localidades');
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
    const localidade = req.body.localidade.trim();
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        const oldData = {
            localidade: localidade
        }
        res.render('admin/adicionarLocalidade', {validationErrors: errors.array({ onlyFirstError: true }), oldData: oldData});
    } else {
        Localidade.create({
            nome: localidade
        })
        .then(localidade => {
            req.flash('success', `Localidade: ${localidade.nome} adicionada com sucesso`);
            res.redirect('/admin/localidades');
        })
        .catch(err => {
            if(err.errors[0].validatorKey == 'not_unique'){
                req.flash('error', err.errors[0].message);
            } else {
                req.flash('error', "Ocurreu um erro ao adicionar a localidade");
            }
            res.redirect('/admin/localidades');
        });
    }
}

exports.updateLocalidade = (req, res, next) => {
    const localidadeId = req.params.id;
    const nomeLocalidade = req.body.localidade;
    const errors = validationResult(req);
    
    const localidade = {
        localidadeId: localidadeId,
        nome: nomeLocalidade
    }

    if(!errors.isEmpty()){
        res.render('admin/editarLocalidade', {validationErrors: errors.array({ onlyFirstError: true }), localidade: localidade});
    } else {
        Localidade.findByPk(localidadeId)
        .then(localidade => {
            if(localidade){
                localidade.nome = nomeLocalidade.trim();
                localidade.save()
                .then(result => {
                    if(result){
                        req.flash('success', 'Localidade actualizada com sucesso.');
                        res.redirect('/admin/localidades');
                    } else {
                        req.flash('error', 'Ocurreu um erro durante a actualização da localidade.');
                        res.redirect('/admin/localidades');
                    } 
                })
                .catch(err => {
                    if(err.errors[0].validatorKey == 'not_unique'){
                        const uniqueError = [{
                                msg: err.errors[0].message
                            }];
                        res.render('admin/editarLocalidade', {validationErrors: uniqueError, localidade: localidade});
                    } else {
                        req.flash('error', "Ocurreu um erro ao adicionar a localidade.");
                        res.redirect('/admin/localidades');
                    }
                });
            } else {
                req.flash('error', 'Localidade não existente');
                res.redirect('/admin/localidades');
            }
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Não foi possível actualizar a localidade.');
            res.redirect('/admin/localidades');
        });
    }
}

exports.deleteLocalidade = (req, res, next) => {
    const localidadeId = req.body.id;

    Localidade.destroy({where: {localidadeId: localidadeId}, limit: 1})
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