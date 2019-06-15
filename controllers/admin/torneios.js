const Torneios = require('../../models/Torneios');
const { validationResult } = require('express-validator/check');

exports.getAllTorneios = (req, res, next) => {
    Localidade.findAll({
        order: [['ano', 'DESC']],
        raw: true
    })
    .then(torneios => {
        res.render('admin/torneios', {torneios: torneios});
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados dos torneios!');
        res.redirect('/admin/torneios');
    });
}