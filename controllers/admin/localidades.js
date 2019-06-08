const Localidade = require('../../models/Localidade');
const { validationResult } = require('express-validator/check');

exports.getAllLocalidades = (req, res, next) => {
    Localidade.findAll()
    .then(localidades => {
        res.render('admin/localidades', {localidades: localidades});
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Ocurreu um erro ao obter dados das localidades!');
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
        Localidade.findOrCreate({where:{nome: localidade}})
        .then(([localidade, created])=> {
            if(created){
                // localidade criada
            } else {
                // localdiade já existie
            }
        })
        .catch(err => {

        });
    }
}