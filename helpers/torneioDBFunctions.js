const sequelize = require('../helpers/database');
const Equipas = require('../models/Equipas');
const Torneios = require('../models/Torneios');
const Escaloes = require('../models/Escaloes');
const Localidades = require('../models/Localidades');
const Jogos = require('../models/Jogos');
const Parciais = require('../models/Parciais');


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

exports.geEscalaoInfo = (escalaoId) => {
    return Escaloes.findOne({
        where: {
            escalaoId: escalaoId
        }
    });
}

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

exports.getEquipa = (equipaId) => {
    return Equipas.findOne({
        include: {
            model: Localidades
        },
        where: {
            equipaId: equipaId
        }
    });
}

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

exports.getUltimaFase = (torneioId, escalaoId) => {
    return Jogos.max(
        'fase',
        {
            where: {
                torneioId: torneioId,
                escalaoId: escalaoId
            }
        }
    );
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

exports.getAllGamesPorCampo = (torneioId, escalaoId, fase, campo) => {
    return Jogos.findAll({
        attributes: ['jogoId', 'equipa1Id', 'equipa2Id'],
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId,
            fase: fase,
            campo: campo
        },
        raw: true
    });
}

exports.getPontuacoes = (jogoId) => {
    return Jogos.findOne({
        attributes: ['equipa1Pontos', 'equipa2Pontos'],
        where: { jogoId: jogoId }
    });
}

exports.getNumGamesPlayed = (torneioId, escalaoId, fase, campo) => {
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

exports.getAllGamesPlayed = (torneioId, escalaoId, fase, campo) => {
    return sequelize.query(
        `SELECT jogos.jogoId, jogos.equipa1Id, jogos.equipa2Id
        FROM jogos
        WHERE jogos.torneioId = ? AND jogos.escalaoId = ? AND jogos.fase = ? AND jogos.campo = ? AND jogos.jogoId
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

exports.getAllGamesNotPlayed = (torneioId, escalaoId, fase, campo) => {
    return sequelize.query(
        `SELECT jogos.jogoId, jogos.equipa1Id, jogos.equipa2Id
        FROM jogos
        WHERE jogos.torneioId = ? AND jogos.escalaoId = ? AND jogos.fase = ? AND jogos.campo = ? AND jogos.jogoId
        NOT IN (
            SELECT jogoId
            FROM parciais
            WHERE equipaId = jogos.equipa1Id OR equipaId = jogos.equipa2Id
        )`,
    {
        replacements: [torneioId, escalaoId, fase, campo],
        type: sequelize.QueryTypes.SELECT
    })
}

////////////////////////////////////////////////////////
//                        PARCIAIS
////////////////////////////////////////////////////////

exports.getParciais = (jogoId, equipaId) => {
    return Parciais.findOne({
        where: {
            jogoId: jogoId,
            equipaId: equipaId
        }
    });
}