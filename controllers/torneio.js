const Equipas = require('../models/Equipas');
const Torneios = require('../models/Torneios');
const Localidades = require('../models/Localidades');
const Escaloes = require('../models/Escaloes');
const Jogos = require('../models/Jogos');
const { validationResult } = require('express-validator/check');
const sequelize = require('../helpers/database');
const util = require('../helpers/util');
const torneioHelpers = require('../helpers/torneioHelperFunctions');

function getTorneioInfo(){
    return Torneios.findOne({where: {activo: 1}, raw: true});
}

function getNumEquipas(torneioId){
    return Equipas.count({where: {torneioId: torneioId}});
}

function getNumCampos(torneioId){
    return Torneios.findOne({
        attributes: ['campos'],
        where: {torneioId : torneioId}
    });
}

function getNumeroJogosPorFase(torneioId, escalaoId, fase){
    return Jogos.count({
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId,
            fase: fase
        }
    });
}

function getEscaloesComEquipas(torneioId){
    return Escaloes.findAll({
        include: {
            model: Equipas,
            where: {torneioId: torneioId},
            attributes: []
        },
        group: ['equipas.escalaoId'] 
    });
}

function getFaseTorneioPorEscalao(torneioId, escalaoId){
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

function getNumeroCamposPorEscalaoFase(torneioId, escalaoId, fase){
    return Jogos.max(
        'campo', {
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId,
            fase: fase
        }
    });
}

function getAllCampos(torneioId, escalaoId, fase){
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

function getAllGames(torneioId, escalaoId, fase, campo) {
    return Jogos.count({
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId,
            fase: fase,
            campo: campo
        }
    });
}

function getAllGamesPlayed(torneioId, escalaoId, fase, campo){
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

    if(numEquipas > 0 && numCampos.campos > 0){
        // Lista dos Escalões com equipas registadas
        const listaEscaloes = await getEscaloesComEquipas(torneioId);

        const escaloesMasculinos = [];
        const escaloesFemininos = [];
        let numTotalJogos = 0;

        // Percorre todos os escalões
        for(const escalao of listaEscaloes){
            // Informações sobre o escalão
            const _escalao = {
                escalaoId: escalao.escalaoId,
                designacao: escalao.designacao,
                sexo: escalao.sexo
            }

            // Verifica em que fase do torneio se encontra o escalão
            const fase = await getFaseTorneioPorEscalao(torneioId, escalao.escalaoId);
            _escalao.fase = (fase == null) ? 0 : fase.fase;

            // Verifica o número de jogos que determinada fase já tem distribuidos
            const numJogos = await getNumeroJogosPorFase(torneioId, _escalao.escalaoId, _escalao.fase);
            _escalao.numJogos = numJogos;
            numTotalJogos += numJogos;

            // Se já existem jogos distribuídos para determinado escalão, então o número de jogos é maior que 0
            if(numJogos > 0){
                // Verifica o número total de campos que determinado escalão ocupa
                const numCampos = await getNumeroCamposPorEscalaoFase(torneioId, _escalao.escalaoId, _escalao.fase);
                _escalao.numCampos = numCampos;
                _escalao.campos = [];

                // Mantem o registo do número de jogos completos
                // Se o número de campos completos for igual ao número de campos então a fase está concluída
                let numCamposCompletos = 0;

                // Obtem a lista de campos para determinado torneio em determinada fase
                // [1,2,3,4,5,6,7,8,9,...]
                const listaCampos = await getAllCampos(torneioId, _escalao.escalaoId, _escalao.fase);
                
                // Percorre cada campo
                for(const campo of listaCampos){
                    // guarda o número do campo
                    const numCampo = campo.num;

                    // Determina para determinado escalão e fase, o número de jogos total para o campo e
                    // o número de jogos já jogados
                    const numJogosParaJogar = await getAllGames(torneioId, _escalao.escalaoId, _escalao.fase, numCampo);
                    const numJogosJogados = await getAllGamesPlayed(torneioId, _escalao.escalaoId, _escalao.fase, numCampo);

                    // Verifica a diferença entre o total de jogos e o número de jogos já jogados
                    if((numJogosParaJogar - numJogosJogados[0].count) > 0){
                        const campoData = {
                            campo: numCampo,
                            completo: false
                        } 
                        _escalao.campos.push(campoData);
                    } else {
                        // Campo com todos os jogos realizados
                        const campoData = {
                            campo: numCampo,
                            completo: true
                        }
                        _escalao.campos.push(campoData);

                        // Actualiza o número de campos completos
                        numCamposCompletos++;
                    }
                }

                // Guarda e veriffica se os jogos de todos os campos já foram jogados
                _escalao.numCamposCompletos = numCamposCompletos;
                if(_escalao.numCampos == _escalao.numCamposCompletos){
                    _escalao.todosCamposCompletos = true;
                } else {
                    _escalao.todosCamposCompletos = false;
                }
            }
          
            if(_escalao.sexo == 0){
                escaloesFemininos.push(_escalao);
            } else {
                escaloesMasculinos.push(_escalao);
            }
        }

        /*console.log(escaloesMasculinos);
        console.log(escaloesMasculinos[1].campos);
        console.log(" ");
        console.log(escaloesFemininos);*/

        res.render('torneio/selecionaEscalao', {torneio: torneio, numTotalJogos: numTotalJogos, escaloesMasculinos: escaloesMasculinos, escaloesFemininos: escaloesFemininos});
    }

}

exports.getNumeroCampos = async (req, res, next) => {
    const torneio = await getTorneioInfo();
    res.render('torneio/definirNumeroCampos', {torneio: torneio});
}

exports.setNumeroCampos = async (req, res, next) => {
    const numCampos = req.body.numCampos;
    const errors = validationResult(req);
    const torneio = await getTorneioInfo();
    
    const oldData = {
        count: numCampos
    }

    if(!errors.isEmpty()){
        res.render('torneio/definirNumeroCampos', {validationErrors: errors.array({ onlyFirstError: true }), torneio: torneio, campos: oldData});
    } else {
        Torneios.findByPk(torneio.torneioId)
        .then(torneio => {
            torneio.campos = numCampos;
            torneio.save()
            .then(result => {
                if(result){
                    req.flash("success", "Número de campos do torneio foi actualizado com sucesso!");
                    res.redirect('/torneio');
                } else {
                    req.flash("error", "Não foi possível definir o número de campos do torneio.");
                    res.redirect('/torneio/definirNumeroCampos');
                }
            })
            .catch(err => {
                console.log(err);
                req.flash("error", "Não foi possível definir o número de campos do torneio.");
                res.redirect('/torneio/definirNumeroCampos');
            });
        })
        .catch(err => {
            console.log(err);
            req.flash("error", "Não foi possível obter os dados do torneio.");
            res.redirect('/torneio/definirNumeroCampos');
        });
    }
}

exports.distribuirTodasEquipas = async (req, res, next) => {
    const torneio = await getTorneioInfo();
    
    torneioHelpers.distribuiEquipasPorCampos(torneio.torneioId, 4, 6);
    
    
    res.send("Distribuir Equipas");
}