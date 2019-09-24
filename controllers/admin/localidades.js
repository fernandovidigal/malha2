const Localidade = require('../../models/Localidades');
const { validationResult } = require('express-validator/check');
const util = require('../../helpers/util');
const dbFunctions = require('../../helpers/DBFunctions');

exports.getAllLocalidades = async (req, res, next) => {
    try {
        const _localidades = dbFunctions.getAllLocalidades();
        const _listaLocalidadesComEquipas = dbFunctions.getLocalidadesComEquipas();

        const [localidades, localidadesComEquipas] = await Promise.all([_localidades, _listaLocalidadesComEquipas]);

        util.sort(localidades);

        if(localidades.length > 0){
            localidades.forEach(localidade => {
                const localidadeIndex = localidadesComEquipas.find(_localidade => _localidade.localidadeId == localidade.localidadeId);
                localidade.eliminavel = (!localidadeIndex) ? true : false;
            });
        }
        
        res.render('admin/localidades', {localidades: localidades, breadcrumbs: req.breadcrumbs()});

    } catch(err){
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados das localidades.');
        res.redirect('/admin/localidades');
    }
}

exports.getLocalidade = async (req, res, next) => {
    try {
        const localidadeId = parseInt(req.params.id);

        const localidade = await dbFunctions.getLocalidade(localidadeId);
        if(localidade){
            req.breadcrumbs('Editar Localidade', '/admin/editarLocalidade');
            res.render('admin/editarLocalidade', {localidade: localidade, breadcrumbs: req.breadcrumbs()});
        } else {
            req.flash('error', 'Localidade não existe.');
            res.redirect('/admin/localidades');
        }
    } catch(err) {
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados da localidade.');
        res.redirect('/admin/localidades');
    }
}

exports.createLocalidade = (req, res, next) => {
    const localidade = req.body.localidade.trim();
    const errors = validationResult(req);

    const oldData = {
        nome: localidade
    }

    if(!errors.isEmpty()){
        req.breadcrumbs('Adicionar Localidade', '/admin/adicionarLocalidade');
        res.render('admin/adicionarLocalidade', {validationErrors: errors.array({ onlyFirstError: true }), localidade: oldData, breadcrumbs: req.breadcrumbs()});
    } else {
        Localidade.findOrCreate({
            where: {
                nome: localidade
            }
        })
        .then(([localidade, created]) => {
            if(created){
                req.flash('success', `Localidade: ${localidade.nome} adicionada com sucesso.`);
                res.redirect('/admin/localidades');
            } else {
                const errors = [{
                    msg: 'Localidade já existe.'
                }]
                res.render('admin/adicionarLocalidade', {validationErrors: errors.array({ onlyFirstError: true }), localidade: oldData, breadcrumbs: req.breadcrumbs()});
            }
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Não foi possível adicionar a localidade.');
            res.redirect('/admin/escaloes');
        });
    }
}

exports.updateLocalidade = (req, res, next) => {
    const localidadeId = req.params.id;
    const nomeLocalidade = req.body.localidade.trim();
    const errors = validationResult(req);
    
    const localidade = {
        localidadeId: localidadeId,
        nome: nomeLocalidade
    }

    if(!errors.isEmpty()){
        req.breadcrumbs('Editar Localidade', '/admin/editarLocalidade');
        res.render('admin/editarLocalidade', {validationErrors: errors.array({ onlyFirstError: true }), localidade: localidade, breadcrumbs: req.breadcrumbs()});
    } else {
        Localidade.findByPk(localidadeId)
        .then(localidade => {
            if(localidade){
                localidade.nome = nomeLocalidade;
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
                                msg: err.errors[0].message,
                                param: 'localidade'
                            }];
                            req.breadcrumbs('Editar Localidade', '/admin/editarLocalidade');
                        res.render('admin/editarLocalidade', {validationErrors: uniqueError, localidade: localidade, breadcrumbs: req.breadcrumbs()});
                    } else {
                        req.flash('error', "Ocurreu um erro ao adicionar a localidade.");
                        res.redirect('/admin/localidades');
                    }
                });
            } else {
                req.flash('error', 'Localidade não existe.');
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