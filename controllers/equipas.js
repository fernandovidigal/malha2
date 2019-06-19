const Equipas = require('../models/Equipas');
const Torneios = require('../models/Torneios');
const Localidades = require('../models/Localidades');
const Escaloes = require('../models/Escaloes');
const { validationResult } = require('express-validator/check');
const util = require('../helpers/util');

function getTorneioInfo(){
    return Torneios.findOne({where: {activo: 1}, raw: true});
}

function getLocalidadesInfo(){
    return Localidades.findAll({
        order: ['nome'],
        raw: true
    })
}

function getEscaloesInfo(){
    return Escaloes.findAll({raw: true});
}

exports.getAllEquipas = async (req, res, next) => {
    const torneioInfo = await getTorneioInfo();
    const localidadesInfo = await getLocalidadesInfo();
    const escaloesInfo = await getEscaloesInfo();

    Promise.all([torneioInfo, localidadesInfo, escaloesInfo])
    .then(([torneio, localidades, escaloes]) => {

        // Ordena correctamente as localidades
        util.sort(localidades);

        res.render('equipas/equipas', {
            torneio: torneio,
            localidades: localidades,
            escaloes: escaloes
        })

        console.log(torneio);
        console.log(localidades);
        console.log(escaloes);
    })
    .catch(err => {
        console.log(err);
    });
}