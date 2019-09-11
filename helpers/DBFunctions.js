const Sequelize = require('sequelize');
const sequelize = require('./database');
const Equipas = require('../models/Equipas');
const Torneios = require('../models/Torneios');
const Escaloes = require('../models/Escaloes');
const Localidades = require('../models/Localidades');
const Jogos = require('../models/Jogos');
const Campos = require('../models/Campos');
const Parciais = require('../models/Parciais');
const Interdicoes = require('../models/Interdicoes');

const Op = Sequelize.Op;


////////////////////////////////////////////////////////
//                        TORNEIOS
////////////////////////////////////////////////////////

exports.getTorneioById = (torneioId) => {
    return Torneios.findByPk(torneioId);
}

exports.getTorneioInfo = () => {
    return Torneios.findOne({where: {activo: 1}, raw: true});
}

exports.getAllTorneios = () => {
    return Torneios.findAll({
        order: [['ano', 'DESC']],
        raw: true
    })
}

exports.getNumTorneios = () => {
    return Torneios.count();
}

exports.setTorneioActivo = async (torneioId) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();

        const affectedRows = await Torneios.update({activo: 0}, {where:{}},{transaction});
        await Torneios.update(
            {activo: 1},
            {where: {torneioId: torneioId}, limit: 1},
            {transaction}
        );

        await transaction.commit();
        return Promise.resolve();
    } catch(err){
        await transaction.rollback();
        return Promise.reject(err);
    }
}

////////////////////////////////////////////////////////
//                        ESCALÕES
////////////////////////////////////////////////////////

exports.getAllEscaloes = () => {
    return Escaloes.findAll({
        order: [['sexo', 'DESC']],
        raw: true
    });
}

exports.getEscalaoInfo = (escalaoId) => {
    return Escaloes.findOne({
        where: {
            escalaoId: escalaoId
        },
        raw: true
    });
}

exports.getEscalao = (escalaoId) => {
    return Escaloes.findOne({
        where: {
            escalaoId: escalaoId
        },
        raw: true
    });
}

exports.getEscaloesInfo = () => {
    return Escaloes.findAll({raw: true});
}

exports.getEscaloesComEquipas = (torneioId) => {
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

exports.getAllEscaloesComJogos = (torneioId) => {
    return Escaloes.findAll({
        include: {
            model: Jogos,
            attributes: [],
            where: {
                torneioId: torneioId
            }
        }
    });
}

exports.getAllEscaloesComCampos = (torneioId) => {
    return Escaloes.findAll({
        attribute: [sequelize.col('campos.numCampos', 'numCampos')],
        include: {
            model: Campos,
            where: {
                torneioId: torneioId
            },
        }
    });
}

exports.getAllEscaloesSemCampos = (torneioId, listaEscaloesComCampo) => {
    return Escaloes.findAll({
        where: {
            escalaoId: {
                [Op.notIn]: listaEscaloesComCampo
            }
        },
        raw: true
    });
}

////////////////////////////////////////////////////////
//                        CAMPOS
////////////////////////////////////////////////////////

exports.getNumeroCamposPorEscalao = (torneioId, escalaoId) => {
    return Campos.findOne({
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId
        },
        raw: true
    });
}

exports.getNumCamposEscaloes = (torneioId) => {
    return Campos.findAll({
        where: {
            torneioId: torneioId
        },
        raw: true
    });
}

exports.getAllCamposTransaction = (torneioId, transaction) => {
    return Campos.findAll({
        where: {
            torneioId: torneioId
        }
    }, {transaction});
}

exports.processaUpdateCampos = async (transaction, torneioId, listaEscaloes) => {
    for(const escalao of listaEscaloes){
        let escalaoCamposToUpdate = await Campos.findOne({
            where: {
                torneioId: torneioId,
                escalaoId: escalao.escalaoId
            }
        }, {transaction});
        
        if(escalaoCamposToUpdate){
            if(escalao.campos == 0){
                await escalaoCamposToUpdate.destroy({transaction});
            } else {
                await escalaoCamposToUpdate.update({
                    numCampos: escalao.campos
                }, {transaction});
            }
        } else {
            if(escalao.campos > 0){
                await Campos.create({
                    torneioId: torneioId,
                    escalaoId: escalao.escalaoId,
                    numCampos: escalao.campos
                }, {transaction});
            }
        }
    }
}

exports.updateNumCampos = (torneioId, escalaoId, numCampos) => {
    return Campos.update({numCampos: numCampos},
        {
            where: {
                torneioId: torneioId,
                escalaoId: escalaoId
            }
        }
    );
}

////////////////////////////////////////////////////////
//                        LOCALIDADES
////////////////////////////////////////////////////////

exports.getLocalidade = (localidadeId) => {
    return Localidades.findOne({
        where: {
            localidadeId: localidadeId
        },
        raw: true
    })
}

exports.getAllLocalidades = () => {
    return Localidades.findAll({
        order: ['nome'],
        raw: true
    });
}

exports.getLocalidadesInfo = () => {
    return Localidades.findAll({
        order: ['nome'],
        raw: true
    })
}

exports.getAllLocalidadesID = () => {
    return Localidades.findAll({
        attributes: ['localidadeId'],
        raw: true
    });
}

////////////////////////////////////////////////////////
//                        INTERDIÇÕES
////////////////////////////////////////////////////////
exports.getCamposInterditados = (torneioId, escalaoId) => {
    return Interdicoes.findAll({
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId
        },
        raw: true
    });
}

////////////////////////////////////////////////////////
//                        EQUIPAS
////////////////////////////////////////////////////////

exports.getEquipa = (torneioId, equipaId) => {
    return Equipas.findOne({
        include: {
            model: Localidades
        },
        where: {
            torneioId: torneioId,
            equipaId: equipaId
        }
    });
}

exports.getSimpleEquipa = (torneioId, equipaId, escalaoId, raw = true) => {
    return Equipas.findOne({
        where: {
            torneioId: torneioId,
            equipaId: equipaId,
            escalaoId: escalaoId
        },
        raw: raw
    });
}

exports.getAllEquipas = (torneioId, escalaoId) => {
    return Equipas.findAll({
        include: {
            model: Localidades
        },
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId
        }
    });
}

exports.getNumTotalEquipas = (torneioId) => {
    return Equipas.count({
        where: {
            torneioId: torneioId
        }
    });
}

exports.getEquipaFullDetails = (torneioId, equipaId, escalaoId) => {
    return Equipas.findOne({
        where: {
            torneioId: torneioId,
            equipaId: equipaId,
            escalaoId: escalaoId
        }, 
        include: [
            {
                model: Localidades,
                attributes: ['nome']
            },
            {
                model: Escaloes
            }
        ]
    });
}

exports.getAllEquipasFullDetails = (whereClause) => {
    return Equipas.findAll({
        where: whereClause, 
        include: [
            {
                model: Localidades,
                attributes: ['nome']
            },
            {
                model: Escaloes,
                attributes: ['designacao', 'sexo']
            }
        ]
    });
}

exports.getAllEquipasPaginacao = (torneioId, offset, limit) => {
    const _offset = (offset-1) * limit;
    return Equipas.findAll({ 
        include: [
            {
                model: Localidades,
                attributes: ['nome']
            },
            {
                model: Escaloes
            }
        ],
        where: {torneioId: torneioId},
        offset: _offset,
        limit: limit
    });
}

exports.getNumEquipasPorFiltro = (whereClause) => {
    return Equipas.count({
        where: whereClause
    });
}

exports.getAllEquipasEscalao = (torneioId, escalaoId) => {
    return Equipas.findAll({
        include: {
            model: Localidades
        },
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId
        }
    });
}

exports.getEquipasPorEscalao = (torneioId, escalaoId) => {
    return Equipas.findAll({
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId
        }
    });
}

exports.getNumEquipas = (torneioId) => {
    return Equipas.count({where: {torneioId: torneioId}});
}

exports.getLastEquipaID = (torneioId, escalaoId) => {
    return Equipas.max('equipaId', {
        where: { 
            torneioId: torneioId,
            escalaoId: escalaoId 
        }
    });
}

exports.getNumEquipasPorEscalao = (torneio_id, escalaoId) => {
    return Equipas.count({
        col: 'equipaId',
        where: {
            torneioId: torneio_id,
            escalaoId: escalaoId
        }
    });
}

exports.getNumEquipasPorCadaEscalao = (torneioId) => {
    return Equipas.findAll({
        attributes: ['escalaoId', [sequelize.fn('count', sequelize.col('equipaId')), 'numEquipas']],
        where: {
            torneioId: torneioId,
        },
        group: ['escalaoId'],
        raw: true
      });
}

exports.getAllEquipasEscalao = (torneioId, escalaoId) => {
    return Equipas.findAll({
        include: {
            model: Localidades
        },
        where: {
            torneioId: torneioId,
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

exports.getAllEquipasPorFiltroPaginacao = (whereClause, offset, limit) => {
    return Equipas.findAll({
        where: whereClause, 
        include: [
            {
                model: Localidades,
                attributes: ['nome']
            },
            {
                model: Escaloes
            }
        ],
        offset: (offset - 1) * limit,
        limit: limit
    }); 
}

exports.getNumEquipasPorConcelhoInfo = (torneioId, escalaoId) => {
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

exports.getLocalidadesComEquipas = () => {
    return Equipas.findAll({
        attributes: ['localidadeId'],
        group: ['localidadeId'],
        raw: true
    });
}

exports.getAllEscaloesComEquipas = () => {
    return Equipas.findAll({
        attributes: ['escalaoId'],
        group: ['escalaoId'],
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

exports.getJogoPorEquipasID = (torneioId, escalaoId, fase, campo, equipa1Id, equipa2Id) => {
    return Jogos.findOne({
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId,
            fase: fase,
            campo: campo,
            equipa1Id: equipa1Id,
            equipa2Id: equipa2Id
        },
        raw: true
    });
}

exports.getAllJogosEscalaoFase = (torneioId, escalaoId, fase) => {
    return Jogos.findAll({
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId,
            fase: fase
        },
        raw: true
    });
}

exports.getAllJogosEscalaoFaseCampo = (torneioId, escalaoId, fase, campo) => {
    return Jogos.findAll({
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId,
            fase: fase,
            campo: campo
        },
        raw: true
    });
}

exports.getNumJogosPorEscalao = (torneioId, escalaoId) => {
    return Jogos.count({
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId
        }
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

exports.getAllFasesPorEscalao = (torneioId, escalaoId) => {
    return Jogos.findAll({
        attributes: ['fase'],
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId
        },
        group: ['fase'],
        raw: true
    });
}

exports.getUltimaFasePorEscalao = (torneioId) => {
    return Jogos.findAll({
        attributes: ['escalaoId', [sequelize.fn('max', sequelize.col('fase')), 'fase']],
        where: {
            torneioId: torneioId
        },
        group: ['escalaoId'],
        raw: true
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

exports.getNumJogosEquipa = (torneioId, equipaId) => {
    return Jogos.count({
        where: {
            torneioId: torneioId,
            [Op.or]: [
                {equipa1Id: equipaId},
                {equipa2Id: equipaId}
            ]
        },
        raw: true
    });
}

exports.getNumGamesPorCampo = (torneioId, escalaoId, fase, campo) => {
    return Jogos.count({
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId,
            fase: fase,
            campo: campo
        }
    });
}

exports.getAllGames = (whereClause) => {
    return Jogos.findAll({
        where: whereClause,
        raw: true
    });
}

exports.getAllGamesPorCampo = (torneioId, escalaoId, fase, campo) => {
    return Jogos.findAll({
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

exports.getEquipasPorJogo = (jogoId) => {
    return Jogos.findOne({
        attributes: ['equipa1Id', 'equipa2Id'],
        where: {
            jogoId: jogoId
        }
    });
}

exports.getAllEquipasComJogos = (torneioId) => {
    return Jogos.findAll({
        attributes: ['equipa1Id', 'equipa2Id'],
        where: {
            torneioId: torneioId
        },
        raw: true
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
    });
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

exports.getNumJogosAllEscaloes = (torneioId) => {
    return Jogos.findAll({
        attributes: ['escalaoId'],
        where: {
            torneioId: torneioId
        },
        group: ['escalaoId'],
        raw: true
    });
}

exports.deleteFase = (torneioId, escalaoId, fase) => {
    return Jogos.destroy({
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId,
            fase: fase
        }
    });
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

exports.getAllParciais = (listaJogos) => {
    return Parciais.findAll({
        where: {
            jogoId: {
                [Op.in]: listaJogos
            }
        },
        raw: true
    });
}

exports.verificaExistenticaJogo = (jogoId) => {
    return Parciais.findAll({
        where: {
            jogoId: jogoId
        },
        raw: true
    });
}

exports.createParciais = async (jogoId, data) => {
    const equipa1ParciaisData = data.parciaisData.equipa1;
    const equipa2ParciaisData = data.parciaisData.equipa2;
    let transaction;

    try { 
        transaction = await sequelize.transaction();
        await Jogos.update({
                    equipa1Pontos: equipa1ParciaisData.pontos,
                    equipa2Pontos: equipa2ParciaisData.pontos
                }, { where: { jogoId: jogoId } }, {transaction});
        
        await Parciais.create({
                    jogoId: jogoId,
                    equipaId: equipa1ParciaisData.equipaId,
                    parcial1: equipa1ParciaisData.parcial1,
                    parcial2: equipa1ParciaisData.parcial2,
                    parcial3: equipa1ParciaisData.parcial3
                }, {transaction});

        await Parciais.create({
                    jogoId: jogoId,
                    equipaId: equipa2ParciaisData.equipaId,
                    parcial1: equipa2ParciaisData.parcial1,
                    parcial2: equipa2ParciaisData.parcial2,
                    parcial3: equipa2ParciaisData.parcial3
                }, {transaction});

        await transaction.commit();
        return Promise.resolve();

    } catch(err){
        await transaction.rollback();
        return Promise.reject(err);
    }
}

exports.updateParciais = async (jogoId, data) => {
    const equipa1ParciaisData = data.parciaisData.equipa1;
    const equipa2ParciaisData = data.parciaisData.equipa2;
    let transaction;

    try { 
        transaction = await sequelize.transaction();
        await Jogos.update({
                    equipa1Pontos: equipa1ParciaisData.pontos,
                    equipa2Pontos: equipa2ParciaisData.pontos
                }, { where: { jogoId: jogoId } }, {transaction});
        
        await Parciais.update({
                    parcial1: equipa1ParciaisData.parcial1,
                    parcial2: equipa1ParciaisData.parcial2,
                    parcial3: equipa1ParciaisData.parcial3
                }, {
                    where: {
                        jogoId: jogoId,
                        equipaId: equipa1ParciaisData.equipaId
                    }
                },{transaction});

        await Parciais.update({
                    parcial1: equipa2ParciaisData.parcial1,
                    parcial2: equipa2ParciaisData.parcial2,
                    parcial3: equipa2ParciaisData.parcial3
                }, {
                    where: {
                        jogoId: jogoId,
                        equipaId: equipa2ParciaisData.equipaId
                    }
                },{transaction});

        await transaction.commit();
        return Promise.resolve();

    } catch(err){
        await transaction.rollback();
        return Promise.reject(err);
    }
}