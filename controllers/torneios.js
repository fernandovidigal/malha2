const Equipas = require('../models/Equipas');
const Torneios = require('../models/Torneios');
const Localidades = require('../models/Localidades');
const Escaloes = require('../models/Escaloes');
const { validationResult } = require('express-validator/check');
const util = require('../helpers/util');

function getTorneioInfo(){
    return Torneios.findOne({where: {activo: 1}, raw: true});
}

function getNumEquipas(torneioId){
    return Equipas.count({where: {torneioId: torneioId}})
}

function getNumCampos(torneioId){
    return Torneios.findOne({
        attributes: ['campos'],
        where: {torneioId : torneioId}
    });
}

exports.getStarting = async (req, res, next) => {
    const torneio = await getTorneioInfo();
    const torneioId = torneio.torneioId;

    // 1. Verificar se existem equipas (não se pode fazer um torneio sem equipas)
    // e se exitem pelo menos 2 equipas
    const numEquipas = await getNumEquipas(torneioId);
    if(numEquipas == 0){
        const error = { msg: "Não existem equipas registadas."};
        return res.render('torneio/index', {torneio: torneio, messages: error});
    } else if(numEquipas < 2){
        const error = { msg: "Existem menos de 2 equipas registadas"};
        return res.render('torneio/index', {torneio: torneio, messages: error});
    }

    // 2. Verificar se existem o número de campos definido para o torneio
    const numCampos = await getNumCampos(torneioId);
    if(numCampos.campos == 0){
        return res.render('torneio/definirNumeroCampos', {torneio: torneio});
    }
}

exports.setNumeroCampos = (req, res, next) => {
    
}