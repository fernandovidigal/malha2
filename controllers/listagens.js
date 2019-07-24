const { validationResult } = require('express-validator/check');
const sequelize = require('../helpers/database');
const Torneios = require('../models/Torneios');
const Escaloes = require('../models/Escaloes');
const Equipas = require('../models/Equipas');
const util = require('../helpers/util');

function getTorneioInfo(){
    return Torneios.findOne({where: {activo: 1}, raw: true});
}

function getEscaloesComEquipas(torneioId){
    return Escaloes.findAll({
        include: {
            model: Equipas,
            where: {torneioId: torneioId},
            attributes: []
        },
        group: ['equipas.escalaoId'],
        raw: true
    });
}

function getEscalaoInfo(escalaoId){
    return Escaloes.findOne({
        where: {
            escalaoId: escalaoId
        },
        raw: true
    });
}

function getNumEquipasPorConcelhoInfo(torneioId, escalaoId){
    return sequelize.query(
        `SELECT count(equipas.equipaId) AS numEquipas, localidades.nome FROM equipas
        INNER JOIN escaloes
        ON escaloes.escalaoId == equipas.escalaoId
        INNER JOIN localidades
        ON localidades.localidadeId == equipas.localidadeId
        WHERE equipas.escalaoId == ? AND equipas.torneioId == ?
        GROUP BY localidades.nome
        ORDER BY localidades.nome ASC`,
    {
        replacements: [escalaoId, torneioId],
        type: sequelize.QueryTypes.SELECT
    });
}

exports.mostraListagens = async (req, res, next) => {
    const torneio = await getTorneioInfo();
    const listaEscaloes = await getEscaloesComEquipas(torneio.torneioId);

    res.render('listagens/index', {torneio: torneio, escaloes: listaEscaloes});
}

exports.numEquipasPorConcelho = async (req, res, next) => {
    const torneio = await getTorneioInfo();
    //console.log(req.body.escalao);

    res.render('listagens/numEquipasPorConcelho', {torneio: torneio});
}

// API
exports.getNumEquipasPorConcelho = async (req, res, next) => {
    const torneio = await getTorneioInfo();
    const escalaoId = req.params.escalao;
    const escalaoInfo = await getEscalaoInfo(escalaoId);
    console.log(torneio);

    const response = {
        success: false
    };

    if(!torneio){
        return res.status(200).json(response);
    }

    const equipasPorConcelho = await getNumEquipasPorConcelhoInfo(torneio.torneioId, escalaoId);
    util.sort(equipasPorConcelho);

    if(equipasPorConcelho.length > 0){
        response.success = true;
        response.torneio = {
            designacao: torneio.designacao,
            localidade: torneio.localidade,
            escalao: escalaoInfo.designacao,
            sexo: (escalaoInfo.sexo == 1) ? 'Masculino' : 'Feminino'
        }

        response.numEquipas = equipasPorConcelho;
        
        let total = 0;
        equipasPorConcelho.forEach(equipa => total += equipa.numEquipas);
        response.total = total;

    } else {
        response.error = {
            msg: 'Não existem equipas registadas neste torneio'
        }
    }

    res.status(200).json(response);
}