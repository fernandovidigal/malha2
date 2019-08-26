const Localidade = require('../../models/Localidades');
const { validationResult } = require('express-validator/check');
const util = require('../../helpers/util');
const dbFunctions = require('../../helpers/DBFunctions');

exports.getAllLocalidades = async (req, res, next) => {
    try {
        const _localidades = await dbFunctions.getAllLocalidades();
        const _torneio = await dbFunctions.getTorneioInfo();
        let localidadesComEquipas = [];

        const [localidades, torneio] = await Promise.all([_localidades, _torneio]);
        if(torneio){
            localidadesComEquipas = await dbFunctions.getLocalidadesComEquipas(torneio.torneioId);
        }

        localidades.forEach(localidade => {
            const localidadeIndex = localidadesComEquipas.indexOf(localidade.localidadeId);
            localidade.eliminavel = (localidadeIndex == -1) ? true : false;
        });
        
        console.log(localidades);
        console.log(localidadesComEquipas);

    } catch(err){
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados das localidades.');
        res.redirect('/admin/localidades');
    }




    /*Localidade.findAll({
        order: ['nome'],
        raw: true
    })
    .then(localidades => {
        util.sort(localidades);
        console.log(localidades);
        res.render('admin/localidades', {localidades: localidades});
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados das localidades.');
        res.redirect('/admin/localidades');
    });*/
}

exports.getLocalidade = (req, res, next) => {
    const localidadeId = req.params.id;
    
    Localidade.findByPk(localidadeId)
    .then(localidade => {
        if(localidade){
            res.render('admin/editarLocalidade', {localidade: localidade});
        } else {
            req.flash('error', 'Localidade não existe.');
            res.redirect('/admin/localidades.');
        }
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados da localidade.');
        res.redirect('/admin/localidades');
    });
}

exports.createLocalidade = (req, res, next) => {
    const localidade = req.body.localidade.trim();
    const errors = validationResult(req);

    const oldData = {
        nome: localidade
    }

    if(!errors.isEmpty()){
        res.render('admin/adicionarLocalidade', {validationErrors: errors.array({ onlyFirstError: true }), localidade: oldData});
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
                res.render('admin/adicionarLocalidade', {validationErrors: errors.array({ onlyFirstError: true }), localidade: oldData});
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
        res.render('admin/editarLocalidade', {validationErrors: errors.array({ onlyFirstError: true }), localidade: localidade});
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
                                msg: err.errors[0].message
                            }];
                        res.render('admin/editarLocalidade', {validationErrors: uniqueError, localidade: localidade});
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