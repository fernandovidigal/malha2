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
                const localidadeIndex = localidadesComEquipas.find(el => el.localidadeId == localidade.localidadeId);
                localidade.eliminavel = (!localidadeIndex) ? true : false;
            });
        }
        
        res.render('admin/localidades', {localidades: localidades, breadcrumbs: req.breadcrumbs()});

    } catch(err){
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados das localidades');
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
            req.flash('error', 'Localidade não existe');
            res.redirect('/admin/localidades');
        }
    } catch(err) {
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados da localidade');
        res.redirect('/admin/localidades');
    }
}

exports.createLocalidade = async (req, res, next) => {
    try {
        const localidade = req.body.localidade.trim();
        const errors = validationResult(req);

        const oldData = {
            nome: localidade
        }

        if(!errors.isEmpty()){
            req.breadcrumbs('Adicionar Localidade', '/admin/adicionarLocalidade');
            res.render('admin/adicionarLocalidade', {validationErrors: errors.array({ onlyFirstError: true }), localidade: oldData, breadcrumbs: req.breadcrumbs()});
        } else {
            const [localidadeModel, created] = await Localidade.findOrCreate({ where: { nome: localidade } });
        
            if(created){
                req.flash('success', `${localidadeModel.nome} adicionada com sucesso`);
                res.redirect('/admin/localidades');
            } else {
                const errors = [{
                    msg: 'Localidade já existe',
                    param: 'localidade'
                }];
                req.breadcrumbs('Adicionar Localidade', '/admin/adicionarLocalidade');
                res.render('admin/adicionarLocalidade', {validationErrors: errors, localidade: oldData, breadcrumbs: req.breadcrumbs()});
            }
        }
    } catch(err) {
        console.log(err);
        req.flash('error', 'Não foi possível adicionar a localidade');
        res.redirect('/admin/localidades');
    }
}

exports.updateLocalidade = async (req, res, next) => {
    try {
        const localidadeId = req.params.id;
        const nomeLocalidade = req.body.localidade.trim();
        const errors = validationResult(req);
        
        const oldData = {
            localidadeId: localidadeId,
            nome: nomeLocalidade
        }

        if(!errors.isEmpty()){
            req.breadcrumbs('Editar Localidade', '/admin/editarLocalidade');
            res.render('admin/editarLocalidade', {validationErrors: errors.array({ onlyFirstError: true }), localidade: oldData, breadcrumbs: req.breadcrumbs()});
        } else {
            const _localidadeExistente = Localidade.findOne({ where: { nome: nomeLocalidade } });
            const _localidade = Localidade.findByPk(localidadeId);
            const [localidadeExistente, localidade] = await Promise.all([_localidadeExistente, _localidade]);
            
            // Se já existe localidade com o mesmo nome, mostra erro
            if(localidadeExistente){
                const uniqueError = [{
                    msg: 'Localidade já existe',
                    param: 'localidade'
                }];

                req.breadcrumbs('Editar Localidade', '/admin/editarLocalidade');
                return res.render('admin/editarLocalidade', {validationErrors: uniqueError, localidade: oldData, breadcrumbs: req.breadcrumbs()});
            }

            // Actualiza a localidade selecionada
            localidade.nome = nomeLocalidade;
            const savedLocalidade = await localidade.save();

            if(!savedLocalidade){
                throw new Error();
            }

            req.flash('success', 'Localidade actualizada com sucesso');
            res.redirect('/admin/localidades');
        }
    } catch(err) {
        console.log(err);
        req.flash('error', 'Não foi possível actualizar a localidade');
        res.redirect('/admin/localidades');
    }
}

exports.deleteLocalidade = (req, res, next) => {
    const localidadeId = parseInt(req.body.id);

    Localidade.destroy({where: {localidadeId: localidadeId}, limit: 1})
    .then(result => {
        if(result){
            res.status(200).json({ success: true });
        } else {
            res.status(200).json({ uccess: false });
        }
    })
    .catch(err => { 
        res.status(200).json({ success: false });
    });
}