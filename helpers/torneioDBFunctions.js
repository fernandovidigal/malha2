const sequelize = require('../helpers/database');
const Equipas = require('../models/Equipas');
const Torneios = require('../models/Torneios');
const Escaloes = require('../models/Escaloes');
const Localidades = require('../models/Localidades');
const Jogos = require('../models/Jogos');


////////////////////////////////////////////////////////
//                        TORNEIOS
////////////////////////////////////////////////////////

exports.getNumCampos = (torneioId) => {
    return Torneios.findOne({
        attributes: ['campos'],
        where: {
            torneioId: torneioId
        }
    });
}

exports.getTorneioInfo = () => {
    return Torneios.findOne({where: {activo: 1}, raw: true});
}

////////////////////////////////////////////////////////
//                        ESCALÕES
////////////////////////////////////////////////////////

exports.getEscaloesComEquipas = (torneioId) => {
    return Escaloes.findAll({
        include: {
            model: Equipas,
            where: {torneioId: torneioId},
            attributes: []
        },
        group: ['equipas.escalaoId'] 
    });
}

////////////////////////////////////////////////////////
//                        LOCALIDADES
////////////////////////////////////////////////////////

exports.getAllLocalidadesID = () => {
    return Localidades.findAll({
        attributes: ['localidadeId']
    });
}

////////////////////////////////////////////////////////
//                        EQUIPAS
////////////////////////////////////////////////////////

exports.getNumEquipas = (torneioId) => {
    return Equipas.count({where: {torneioId: torneioId}});
}

exports.getNumEquipasPorEscalao = (torneio_id, escalaoId) => {
    return Equipas.count({
        col: 'escalaoId',
        where: {
            torneioId: torneio_id,
            escalaoId: escalaoId
        }
    });
}

exports.getNumEquipasPorLocalidadeAndEscalao = (torneioId, localidadeId, escalaoId) => {
    return Equipas.count({
        col: 'equipaId',
        where: {
            torneioId: torneioId,
            localidadeId: localidadeId,
            escalaoId: escalaoId
        }
    });
}

exports.getEquipasIDByLocalidadeAndEscalao = (torneioId, localidadeId, escalaoId) => {
    return Equipas.findAll({
        attributes: ['equipaId'],
        where: {
            torneioId: torneioId,
            localidadeId: localidadeId,
            escalaoId: escalaoId
        },
        raw: true
    });
}

////////////////////////////////////////////////////////
//                        JOGOS
////////////////////////////////////////////////////////

exports.createJogo = (torneioId, escalaoId, fase, campo, equipa1Id, equipa2Id) => {
    return Jogos.create({
        torneioId: torneioId,
        escalaoId: escalaoId,
        fase: fase,
        campo: campo,
        equipa1Id: equipa1Id,
        equipa2Id: equipa2Id
    });
}

exports.getNumeroJogosPorFase = (torneioId, escalaoId, fase) => {
    return Jogos.count({
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId,
            fase: fase
        }
    });
}

exports.getFaseTorneioPorEscalao = (torneioId, escalaoId) => {
    return Jogos.findOne({
        attributes: ['fase'],
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId
        },
        group: ['fase'],
        order: [['fase', "DESC"]]
    });
}

exports.getNumeroCamposPorEscalaoFase = (torneioId, escalaoId, fase) => {
    return Jogos.max(
        'campo', {
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId,
            fase: fase
        }
    });
}

exports.getAllCampos = (torneioId, escalaoId, fase) => {
    return Jogos.findAll({
        attributes: [['campo', 'num']],
        where: {
            torneioId,
            escalaoId: escalaoId,
            fase: fase
        },
        group: ['campo'],
        raw: true
    });
}

exports.getAllGames = (torneioId, escalaoId, fase, campo) => {
    return Jogos.count({
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId,
            fase: fase,
            campo: campo
        }
    });
}

exports.getAllGamesPlayed = (torneioId, escalaoId, fase, campo) => {
    return sequelize.query(
        `SELECT COUNT(jogoId) AS count
        FROM jogos
        WHERE torneioId = ? AND escalaoId = ? AND fase = ? AND campo = ? AND jogoId
        IN (
            SELECT jogoId
            FROM parciais
            WHERE equipaId = jogos.equipa1Id OR equipaId = jogos.equipa2Id
        )`,
    {
        replacements: [torneioId, escalaoId, fase, campo],
        type: sequelize.QueryTypes.SELECT
    })
}

exports.getAllCamposPorEscalaoFase = (torneioId, escalaoId, fase) => {
    return Jogos.findAll({
        attributes: ['campo'],
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId,
            fase: fase
        },
        group: ['campo'],
        raw: true
    });
}