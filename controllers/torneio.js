const Equipas = require('../models/Equipas');
const Torneios = require('../models/Torneios');
const Localidades = require('../models/Localidades');
const Escaloes = require('../models/Escaloes');
const Jogos = require('../models/Jogos');
const { validationResult } = require('express-validator/check');
const util = require('../helpers/util');
const torneioHelpers = require('../helpers/torneioHelperFunctions');
const dbFunctions = require('../helpers/torneioDBFunctions');

exports.getStarting = async (req, res, next) => {
    const torneio = await dbFunctions.getTorneioInfo();
    const torneioId = torneio.torneioId;

    // 1. Verificar se existem equipas (não se pode fazer um torneio sem equipas)
    // e se exitem pelo menos 2 equipas
    const numEquipas = await dbFunctions.getNumEquipas(torneioId);
    if(numEquipas == 0){
        const error = { msg: "Não existem equipas registadas."};
        return res.render('torneio/index', {torneio: torneio, messages: error});
    } else if(numEquipas < 2){
        const error = { msg: "Existem menos de 2 equipas registadas"};
        return res.render('torneio/index', {torneio: torneio, messages: error});
    }

    // 2. Verificar se existem o número de campos definido para o torneio
    const numCampos = await dbFunctions.getNumCampos(torneioId);
    if(numCampos.campos == 0){
        return res.render('torneio/definirNumeroCampos', {torneio: torneio});
    }

    if(numEquipas > 0 && numCampos.campos > 0){
        // Lista dos Escalões com equipas registadas
        const listaEscaloes = await dbFunctions.getEscaloesComEquipas(torneioId);

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
            const fase = await dbFunctions.getFaseTorneioPorEscalao(torneioId, escalao.escalaoId);
            _escalao.fase = (fase == null) ? 0 : fase.fase;

            // Verifica o número de jogos que determinada fase já tem distribuidos
            const numJogos = await dbFunctions.getNumeroJogosPorFase(torneioId, _escalao.escalaoId, _escalao.fase);
            _escalao.numJogos = numJogos;
            numTotalJogos += numJogos;

            // Se já existem jogos distribuídos para determinado escalão, então o número de jogos é maior que 0
            if(numJogos > 0){
                // Verifica o número total de campos que determinado escalão ocupa
                const numCampos = await dbFunctions.getNumeroCamposPorEscalaoFase(torneioId, _escalao.escalaoId, _escalao.fase);
                _escalao.numCampos = numCampos;
                _escalao.campos = [];

                // Mantem o registo do número de jogos completos
                // Se o número de campos completos for igual ao número de campos então a fase está concluída
                let numCamposCompletos = 0;

                // Obtem a lista de campos para determinado torneio em determinada fase
                // [1,2,3,4,5,6,7,8,9,...]
                const listaCampos = await dbFunctions.getAllCampos(torneioId, _escalao.escalaoId, _escalao.fase);
                
                // Percorre cada campo
                for(const campo of listaCampos){
                    // guarda o número do campo
                    const numCampo = campo.num;

                    // Determina para determinado escalão e fase, o número de jogos total para o campo e
                    // o número de jogos já jogados
                    const numJogosParaJogar = await dbFunctions.getAllGames(torneioId, _escalao.escalaoId, _escalao.fase, numCampo);
                    const numJogosJogados = await dbFunctions.getNumGamesPlayed(torneioId, _escalao.escalaoId, _escalao.fase, numCampo);

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
    const torneio = await dbFunctions.getTorneioInfo();
    res.render('torneio/definirNumeroCampos', {torneio: torneio});
}

exports.setNumeroCampos = async (req, res, next) => {
    const numCampos = req.body.numCampos;
    const errors = validationResult(req);
    const torneio = await dbFunctions.getTorneioInfo();
    
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

// TODO: handle promises
exports.distribuirTodasEquipas = async (req, res, next) => {
    const torneio = await dbFunctions.getTorneioInfo();
    
    torneioHelpers.distribuiEquipasPorCampos(torneio.torneioId, 4, 6);
    
    res.redirect('/torneio');
}

// TODO: handle promises
exports.distribuirEquipasPorEscalao = async (req, res, next) => {
    const torneio = await dbFunctions.getTorneioInfo();
    const escalaoId = req.params.escalao;

    torneioHelpers.distribuiEquipasPorCampos(torneio.torneioId, 4, 6, escalaoId);

    res.redirect('/torneio');
}

async function processaEquipas(listaJogos){ 
    const jogos = [];
    for(const jogo of listaJogos){
        const jogoId = jogo.jogoId;
        const equipa1Id = jogo.equipa1Id;
        const equipa2Id = jogo.equipa2Id;

        const equipa1Info = await dbFunctions.getEquipa(equipa1Id);
        const equipa2Info = await dbFunctions.getEquipa(equipa2Id);

        await Promise.all([equipa1Info, equipa2Info])
        .then(([_equipa1Info, _equipa2Info]) => {
            const equipas = {
                jogoId: jogoId,
                equipa1Id: _equipa1Info.equipaId,
                equipa1PrimeiroElemento: _equipa1Info.primeiroElemento,
                equipa1SegundoElemento: _equipa1Info.segundoElemento,
                equipa1Localidade: _equipa1Info.localidade.nome,
                equipa2Id: _equipa2Info.equipaId,
                equipa2PrimeiroElemento: _equipa2Info.primeiroElemento,
                equipa2SegundoElemento: _equipa2Info.segundoElemento,
                equipa2Localidade: _equipa2Info.localidade.nome,
            }
            jogos.push(equipas);
        })
        .catch(err => {
            //TODO: implementar em caso de erro!
        });
    }

    return jogos;
}

exports.mostraResultados = async (req, res, next) => {
    const escalaoId = req.params.escalao;
    const fase = req.params.fase;
    const campo = parseInt(req.params.campo);

    const torneio = await dbFunctions.getTorneioInfo();

    const listaCampos = dbFunctions.getAllCamposPorEscalaoFase(torneio.torneioId, escalaoId, fase);
    const ultimaFase = dbFunctions.getUltimaFase(torneio.torneioId, escalaoId);
    const escalaoInfo = dbFunctions.geEscalaoInfo(escalaoId);

    Promise.all([listaCampos, ultimaFase, escalaoInfo])
    .then(async ([_listaCampos, _ultimaFase, _escalaoInfo]) => {

        // 1. Preencher um array com todas as fases até à actual
        // Objectivo: poder alternar de fase no ecrã dos resultados
        const todasFases = [];
        for(let i = 0; i < _ultimaFase; i++){ todasFases.push(i+1); }

        // 2. Preencher um array com o mesmo número de campos que o escalão tem ocupados
        const campos = [];
        if(campo == 0){
            for(let i = 0; i < _listaCampos.length; i++){
                campos.push({campo: i+1});
            }
        } else {
            campos.push({campo: campo});
        }

        // 3. Obter todos os jogos de cada campos
        for(let i = 0; i < campos.length; i++){
            // Processa a lista de jogos que ainda falta jogar
            const listaJogosPorJogar = dbFunctions.getAllGamesNotPlayed(torneio.torneioId, escalaoId, fase, campos[i].campo);

            // Processa a lista de jogos que já foram jogados
            const listaJogosFinalizados = dbFunctions.getAllGamesPlayed(torneio.torneioId, escalaoId, fase, campos[i].campo);

            await Promise.all([listaJogosPorJogar, listaJogosFinalizados])
            .then(async ([_jogos, _jogosFinalizados]) => {
                campos[i].jogos = await processaEquipas(_jogos);
                campos[i].jogosFinalizados = await processaEquipas(_jogosFinalizados);
            })
            .catch(err => {
                //TODO: implementar em caso de erro!
            });

            // Obter parciais dos jogos já finalizados
            for(const jogo of campos[i].jogosFinalizados){
                const equipa1Parciais = dbFunctions.getParciais(jogo.jogoId, jogo.equipa1Id);
                const equipa2Parciais = dbFunctions.getParciais(jogo.jogoId, jogo.equipa2Id);
                const pontuacoes = dbFunctions.getPontuacoes(jogo.jogoId);

                await Promise.all([equipa1Parciais, equipa2Parciais, pontuacoes])
                .then(([_equipa1Parciais, _equipa2Parciais, _pontuacoes]) => {
                    jogo.equipa1Pontos = _pontuacoes.equipa1Pontos;
                    jogo.equipa2Pontos = _pontuacoes.equipa2Pontos;
                    jogo.equipa1Parciais = {
                        parcial1: _equipa1Parciais.parcial1,
                        parcial2: _equipa1Parciais.parcial2,
                        parcial3: _equipa1Parciais.parcial3
                    };
                    jogo.equipa2Parciais = {
                        parcial1: _equipa2Parciais.parcial1,
                        parcial2: _equipa2Parciais.parcial2,
                        parcial3: _equipa2Parciais.parcial3
                    };
                })
                .catch(err => {
                    //TODO: implementar em caso de erro!
                });
            }
        }

        res.render('torneio/index', {torneio: torneio, campos: campos});
    })
    .catch();
}