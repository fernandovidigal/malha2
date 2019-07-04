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

    try {
        const torneio = await dbFunctions.getTorneioInfo();

        // Não existe torneio registado ou activo
        if(!torneio){
            req.flash('error', 'Não existem torneios activos.');
            return res.redirect("../");
        }
        const torneioId = torneio.torneioId;

        // 1. Verificar se existem equipas (não se pode fazer um torneio sem equipas)
        // e se exitem pelo menos 2 equipas
        const numEquipas = await dbFunctions.getNumEquipas(torneioId);
        if(numEquipas == 0){
            const error = { msg: "Não existem equipas registadas no torneio."};
            return res.render('torneio/index', {torneio: torneio, messages: error});
        } else if(numEquipas < 2){
            const error = { msg: "Existem menos de 2 equipas registadas."};
            return res.render('torneio/index', {torneio: torneio, messages: error});
        }

        // 2. Verificar se o número de campos para o torneio está definido
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

                // Verificar se o escalão tem mais de 2 equipas
                // Se não tiver, mostrar alerta
                // TODO:

                // Verifica em que fase do torneio se encontra o escalão
                const fase = await dbFunctions.getFaseTorneioPorEscalao(torneioId, escalao.escalaoId);
                _escalao.fase = (fase == null) ? 0 : fase.fase;

                // Verifica o número de jogos que determinada fase já tem distribuidos
                const numJogos = await dbFunctions.getNumeroJogosPorFase(torneioId, _escalao.escalaoId, _escalao.fase);
                _escalao.numJogos = numJogos;

                // Serve para verificar se já existem jogos distribuídos para algum escalão
                // s´Se for 0, então nenhum escalão tem jogos distribuídos
                numTotalJogos += numJogos;

                // Se já existem jogos distribuídos para determinado escalão, então o número de jogos é maior que 0
                // então obtem as informações sobre os jogos
                if(numJogos > 0){
                    // Verifica o número total de campos que determinado escalão ocupa
                    const numCampos = await dbFunctions.getNumeroCamposPorEscalaoFase(torneioId, _escalao.escalaoId, _escalao.fase);
                    _escalao.numCampos = numCampos;
                    _escalao.campos = [];

                    // Mantem o registo do número de jogos completos
                    // Se o número de campos completos for igual ao número de campos total do escalão então a fase está concluída
                    let numCamposCompletos = 0;

                    // Obtem a lista de campos para determinado torneio em determinada fase
                    // [1,2,3,4,5,6,7,8,9,...]
                    const listaCampos = await dbFunctions.getAllCampos(torneioId, _escalao.escalaoId, _escalao.fase);
                    
                    // Para cada campo da lista de campos
                    for(const campo of listaCampos){
                        // guarda o número do campo
                        const numCampo = campo.num;

                        // Determina para determinado escalão e fase, o número de jogos total para o campo e
                        // o número de jogos já jogados
                        const numJogosParaJogar = await dbFunctions.getNumGamesPorCampo(torneioId, _escalao.escalaoId, _escalao.fase, numCampo);
                        const numJogosJogados = await dbFunctions.getNumGamesPlayed(torneioId, _escalao.escalaoId, _escalao.fase, numCampo);

                        // Verifica a diferença entre o total de jogos e o número de jogos já jogados
                        if((numJogosParaJogar - numJogosJogados[0].count) > 0){
                            const campoData = {
                                campo: (numCampo == 1000) ? 'Final' : (numCampo == 500 ? '3º e 4º' : numCampo),
                                completo: false
                            } 
                            _escalao.campos.push(campoData);
                        } else {
                            // Campo com todos os jogos realizados
                            const campoData = {
                                campo: (numCampo == 1000) ? 'Final' : (numCampo == 500 ? '3º e 4º' : numCampo),
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

            /*console.log("Escalões Masculinos:");
            console.log(escaloesMasculinos);
            console.log("Escalões Masculinos 1 Elemento:");
            console.log(escaloesMasculinos[1].campos);
            console.log(" ");
            console.log("Escalões Femininos:");
            console.log(escaloesFemininos);*/

            res.render('torneio/selecionaEscalao', {torneio: torneio, numTotalJogos: numTotalJogos, escaloesMasculinos: escaloesMasculinos, escaloesFemininos: escaloesFemininos});
        }
    } catch(e) {
        console.log(e);
        req.flash('error', 'Ocorreu um erro! Não foi possível aceder à página do torneio.');
        res.redirect('../');
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

    await torneioHelpers.distribuiEquipasPorCampos(torneio.torneioId, 4, 6);
    
    res.redirect('/torneio');
}

// TODO: handle promises
exports.distribuirEquipasPorEscalao = async (req, res, next) => {
    const torneio = await dbFunctions.getTorneioInfo();
    const escalaoId = req.params.escalao;

    await torneioHelpers.distribuiEquipasPorCampos(torneio.torneioId, 4, 6, escalaoId);

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

async function verificaCamposCompletos(listaCampos, torneioId, escalaoId, fase){

    for(const campo of listaCampos){
        // Otem o número total dos jogos do campo
        const numTotalJogos = dbFunctions.getNumGamesPorCampo(torneioId, escalaoId, fase, campo.campo);
        // Obtem a lista de jogos que já foram jogados
        const listaJogosFinalizados = dbFunctions.getAllGamesPlayed(torneioId, escalaoId, fase, campo.campo);

        await Promise.all([numTotalJogos, listaJogosFinalizados])
        .then(([_numTotalJogos, _listaJogosFinalizados]) => {
            if(_numTotalJogos - _listaJogosFinalizados.length == 0){
                campo.campoCompleto = true;
            } else {
                campo.campoCompleto = false;
            }
        });
    }

    return listaCampos;
}

// Resultados
exports.mostraResultados = async (req, res, next) => {
    const escalaoId = req.params.escalao;
    const fase = req.params.fase;
    const campo = parseInt(req.params.campo);

    const torneio = await dbFunctions.getTorneioInfo();

    const listaCampos = dbFunctions.getAllCamposPorEscalaoFase(torneio.torneioId, escalaoId, fase);
    const ultimaFase = dbFunctions.getUltimaFase(torneio.torneioId, escalaoId);
    const escalaoInfo = dbFunctions.geEscalaoInfo(escalaoId);

    const info = {
        escalaoId: escalaoId,
        fase: fase,
        campo: 0
    }

    Promise.all([listaCampos, ultimaFase, escalaoInfo])
    .then(async ([_listaCampos, _ultimaFase, _escalaoInfo]) => {

        // 1. Preencher um array com todas as fases até à actual
        // Objectivo: poder alternar de fase no ecrã dos resultados
        const todasFases = [];
        for(let i = 0; i < _ultimaFase; i++){ todasFases.push(i+1); }

        // Adicionar a lista de fase a info para que se possa alternar de fase nos resultados
        info.listaFases = todasFases;

        // 2. Preencher um array com o mesmo número de campos que o escalão tem ocupados
        const campos = [];
        if(campo == 0){
            for(let i = 0; i < _listaCampos.length; i++){
                campos.push({campo: i+1});
            }
        } else {
            // Número do campo é passado como parametro
            campos.push({campo: campo});
            info.campo = campo;
        }

        _listaCampos = await verificaCamposCompletos(_listaCampos, torneio.torneioId, escalaoId, fase);

        // 3. Obter todos os jogos de cada campo
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

        //console.log(campos);

        res.render('torneio/index', {torneio: torneio, info: info, campos: campos, listaCampos: _listaCampos});
    })
    .catch();
}

exports.processaProximaFase = async (req, res, next) => {
    const escalaoId = req.params.escalao;

    const torneio = await dbFunctions.getTorneioInfo();
    const ultimaFase = await dbFunctions.getUltimaFase(torneio.torneioId, escalaoId);
    const proximaFase = ultimaFase + 1;

    const listaCampos = await processaClassificacao(torneio.torneioId, escalaoId, ultimaFase);

    // Só existem 2 campos, então processa jogos 3ª e 4ª lugar e final
    if(listaCampos.length == 2){
        // Adiciona jogo da final
        await dbFunctions.createJogo(torneio.torneioId, escalaoId, 100, 1000, listaCampos[0].classificacao[0].equipaId, listaCampos[1].classificacao[0].equipaId);
        // Adiciona jogo do 3º e 4º lugar
        await dbFunctions.createJogo(torneio.torneioId, escalaoId, 100, 500, listaCampos[0].classificacao[1].equipaId, listaCampos[1].classificacao[1].equipaId);

        res.redirect('/torneio');
    } else {

        const listaEquipasApuradas = [];
        for(const campo of listaCampos){
            listaEquipasApuradas.push(campo.classificacao[0]);

            // Na fase 3 e seguintes apenas o vencedor passa à próxima fase
            if(ultimaFase < 2){
                listaEquipasApuradas.push(campo.classificacao[1]);
            }
        }


        // Agrupa as equipas por localidade para não calharem equipas da mesma localidade no mesmo campo
        listaEquipasApuradas.sort((a, b) => {
            if(a.localidadeId < b.localidadeId){
                return -1;
            } else {
                return 1;
            }
        });

        const numCampos = listaEquipasApuradas.length / 2;
        let campoActual = 0;
        let k = 0;
        // Cria uma array multidimensional com o número de campos para a próxima fase;
        const listaEquipasPorCampo = [];
        for(let i = 0; i < numCampos; i++){
            listaEquipasPorCampo.push(new Array());
        }

        while(k < listaEquipasApuradas.length){
            if(campoActual >= numCampos){
                campoActual = 0;
            }

            listaEquipasPorCampo[campoActual].push(listaEquipasApuradas[k]);
            campoActual++;
            k++;
        }

        campoActual = 1;
        for(const par of listaEquipasPorCampo){
            await dbFunctions.createJogo(torneio.torneioId, escalaoId, proximaFase, campoActual, par[0].equipaId, par[1].equipaId);
            campoActual++;
        }

        //console.log(listaEquipasPorCampo);
        
        res.redirect('/torneio');
    }
}

async function processaClassificacao(torneioId, escalaoId, fase, campo = 0){

    const _listaCampos = await dbFunctions.getAllCamposPorEscalaoFase(torneioId, escalaoId, fase);

    // 1. Preencher um array com o mesmo número de campos que o escalão tem ocupados
    const listaCampos = [];
    if(campo == 0){
        for(let i = 0; i < _listaCampos.length; i++){
            listaCampos.push({campo: i+1});
        }
    } else {
        // Número do campo é passado como parametro
        listaCampos.push({campo: campo});
    }

    for(const campo of listaCampos){
        const numCampo = campo.campo;
        // 1. Obter a lista de Jogos para cada campo
        const listaJogos = await dbFunctions.getAllGamesPorCampo(torneioId, escalaoId, fase, numCampo);

        // Bloco necessário para desempate por parciais
        // {
            //const listaJogosId = listaJogos.map(elemento => elemento.jogoId);
            //console.log(listaJogosId);

            //const listaParciais = await dbFunctions.getAllParciais(listaJogosId);
            //console.log(listaParciais);
        // }

        campo.classificacao = [];
        const classificacao = campo.classificacao;

        // 2. Percorre a lista de jogos e coloca as equipas na lista de classificação
        for(const jogo of listaJogos){
            // 3. Procura pela posição, se existir, dentro do array da classificação
            const posicaoEquipa1 = classificacao.findIndex(elemento => {
                return elemento.equipaId == jogo.equipa1Id;
            });

            const posicaoEquipa2 = classificacao.findIndex(elemento => {
                return elemento.equipaId == jogo.equipa2Id;
            });

            const equipa1 = await dbFunctions.getEquipa(jogo.equipa1Id);
            const equipa2 = await dbFunctions.getEquipa(jogo.equipa2Id);

            // Coloca a equipa na lista de classificações ou actualiza-a se já existir
            // -1, não eixte. > -1, existe
            if(posicaoEquipa1 != -1){
                classificacao[posicaoEquipa1].vitorias = (jogo.equipa1Pontos > jogo.equipa2Pontos) ? classificacao[posicaoEquipa1].vitorias = classificacao[posicaoEquipa1].vitorias + 1 : classificacao[posicaoEquipa1].vitorias;
                classificacao[posicaoEquipa1].pontos = classificacao[posicaoEquipa1].pontos + jogo.equipa1Pontos;
            } else { // não existe
                const equipa = {
                    equipaId: jogo.equipa1Id,
                    primeiroElemento: equipa1.primeiroElemento,
                    segundoElemento: equipa1.segundoElemento,
                    localidadeId: equipa1.localidade.localidadeId,
                    localidade: equipa1.localidade.nome,
                    vitorias: (jogo.equipa1Pontos > jogo.equipa2Pontos) ? 1 : 0,
                    pontos: jogo.equipa1Pontos
                }
                classificacao.push(equipa);
            }

            if(posicaoEquipa2 != -1){
                classificacao[posicaoEquipa2].vitorias = (jogo.equipa2Pontos > jogo.equipa1Pontos) ? classificacao[posicaoEquipa2].vitorias = classificacao[posicaoEquipa2].vitorias + 1 : classificacao[posicaoEquipa2].vitorias;
                classificacao[posicaoEquipa2].pontos = classificacao[posicaoEquipa2].pontos + jogo.equipa2Pontos;
            } else { // não existe
                const equipa = {
                    equipaId: jogo.equipa2Id,
                    primeiroElemento: equipa2.primeiroElemento,
                    segundoElemento: equipa2.segundoElemento,
                    localidadeId: equipa2.localidade.localidadeId,
                    localidade: equipa2.localidade.nome,
                    vitorias: (jogo.equipa2Pontos > jogo.equipa1Pontos) ? 1 : 0,
                    pontos: jogo.equipa2Pontos
                }
                classificacao.push(equipa);
            }  
        }

        // 3. Ordena a Classificação
        ordenaClassificacao(classificacao, listaJogos);
    }

    return listaCampos;
}

function ordenaClassificacao(classificacao, listaJogos){
    classificacao.sort((a, b) => {
        // Diferença de Pontos
        if(a.pontos > b.pontos){
            return -1;
        } else if(a.pontos === b.pontos){
            // Mesmos pontos, desempata por número de vitórias
            if(a.vitorias > b.vitorias){
                return -1;
            } else if(a.vitorias === b.vitorias) {
                // Mesmo número de vitórias, desempata por resultado do confronto directo
                const jogo = listaJogos.find(elemento => {
                    return (elemento.equipa1Id == a.equipaId && elemento.equipa2Id == b.equipaId) || (elemento.equipa1Id == b.equipaId && elemento.equipa2Id == a.equipaId);
                });
                if(jogo.equipa1Pontos > jogo.equipa2Pontos){
                    return -1;
                } else {
                    return 1;
                }
            } else {
                return 1;
            }
        } else {
            return 1;
        }
    });
}

// Classificação
exports.mostraClassificacao = async (req, res, next) => {
    const escalaoId = req.params.escalao;
    const fase = req.params.fase;
    const campo = parseInt(req.params.campo);

    const torneio = await dbFunctions.getTorneioInfo();
    
    const listaCampos = await processaClassificacao(torneio.torneioId, escalaoId, fase, campo);

    res.render('torneio/classificacao', {torneio: torneio, listaCampos: listaCampos});
}

// API
function processaPontuacao(data){
    let equipa1Pontos = 0;
    let equipa2Pontos = 0;
    let vitoriasEquipa1 = 0;
    let vitoriasEquipa2 = 0;

    //console.log(data.parciaisData);

    if(data.parciaisData.equipa1.parcial1 == 30 && data.parciaisData.equipa2.parcial1 < 30){
        vitoriasEquipa1++;
    } else if(data.parciaisData.equipa1.parcial1 < 30 && data.parciaisData.equipa2.parcial1 == 30){
        vitoriasEquipa2++;
    }

    if(data.parciaisData.equipa1.parcial2 == 30 && data.parciaisData.equipa2.parcial2 < 30){
        vitoriasEquipa1++;
    } else if(data.parciaisData.equipa1.parcial2 < 30 && data.parciaisData.equipa2.parcial2 == 30){
        vitoriasEquipa2++;
    }

    if(data.parciaisData.equipa1.parcial3 != null && data.parciaisData.equipa2.parcial3 != null){
        if(data.parciaisData.equipa1.parcial3 == 30 && data.parciaisData.equipa2.parcial3 < 30){
            vitoriasEquipa1++;
        } else if(data.parciaisData.equipa1.parcial3 < 30 && data.parciaisData.equipa2.parcial3 == 30){
            vitoriasEquipa2++;
        }
    }

    let resultado = vitoriasEquipa1 - vitoriasEquipa2;
    switch(resultado){
        case 3:
        case 2: equipa1Pontos = 3;
                equipa2Pontos = 0;
                break;
        case 1: equipa1Pontos = 2;
                equipa2Pontos = 1;
                break;
        case -1: equipa1Pontos = 1;
                 equipa2Pontos = 2;
                 break;
        case -2: 
        case -3: equipa1Pontos = 0;
                 equipa2Pontos = 3;
                 break;
    }

    data.parciaisData.equipa1.pontos = equipa1Pontos;
    data.parciaisData.equipa2.pontos = equipa2Pontos;

    return data;
}

exports.createParciais = async (req, res, next) => {
    let data = req.body;
    const jogoId = data.jogoId;
    const equipas = await dbFunctions.getEquipasPorJogo(jogoId);

    data.parciaisData.equipa1.equipaId = equipas.equipa1Id;
    data.parciaisData.equipa2.equipaId = equipas.equipa2Id;
    
    data = processaPontuacao(data);

    dbFunctions.createParciais(jogoId, data)
    .then((result)=>{
        res.status(200).json({
            success: true,
            equipa1_pontos: data.parciaisData.equipa1.pontos,
            equipa2_pontos: data.parciaisData.equipa2.pontos
        });
    }).catch((err)=>{
        res.status(200).json({
            success: false,
            equipa1_pontos: data.parciaisData.equipa1.pontos,
            equipa2_pontos: data.parciaisData.equipa2.pontos
        });
    });
}

exports.updateParciais = async (req, res, next) => {
    let data = req.body;
    const jogoId = data.jogoId;
    const equipas = await dbFunctions.getEquipasPorJogo(jogoId);

    data.parciaisData.equipa1.equipaId = equipas.equipa1Id;
    data.parciaisData.equipa2.equipaId = equipas.equipa2Id;

    data = processaPontuacao(data);

    dbFunctions.updateParciais(jogoId, data)
    .then((result)=>{
        res.status(200).json({
            success: true,
            equipa1_pontos: data.parciaisData.equipa1.pontos,
            equipa2_pontos: data.parciaisData.equipa2.pontos
        });
    }).catch((err)=>{
        res.status(200).json({
            success: false,
            equipa1_pontos: data.parciaisData.equipa1.pontos,
            equipa2_pontos: data.parciaisData.equipa2.pontos
        });
    });
}