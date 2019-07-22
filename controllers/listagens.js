const { validationResult } = require('express-validator/check');
const Torneios = require('../models/Torneios');

function getTorneioInfo(){
    return Torneios.findOne({where: {activo: 1}, raw: true});
}

exports.mostraListagens = async (req, res, next) => {
    const torneio = await getTorneioInfo();
    res.render('listagens/index', {torneio: torneio});
}