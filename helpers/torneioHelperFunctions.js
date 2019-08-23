const dbFunctions = require('./torneioDBFunctions');
const sequelize = require('../helpers/database');

/*function determinaNumeroTotalCampos(numEquipas, numCamposTorneio, minEquipas, maxEquipas){
    
    // Minimo de campos necessário para se jogar
    const minCampos = Math.ceil(numEquipas / maxEquipas);

    if(numCamposTorneio < minCampos){
        return 0;
    }

    let minEquipasIter = minEquipas;

    let found = false;
    let numCampos = 0;
    while(!found){
        //console.log("minEquipasIter: " + minEquipasIter);

        numCampos = Math.floor(numEquipas / minEquipasIter);
        //console.log("numCampos: " + numCampos);
        // Calcula com quantas equipas fica o último campo
        let calc = numEquipas - (numCampos * minEquipasIter);
        //console.log("calc: " + calc);

        // Verifica se o último campo tem menos que o mínimo das equipas requeridas no torneio
        // e se o valor iterativo do mínimo das equipas não fica superior ao valor máximo das equipas
        // requiridas no torneio
        //console.log("minEquipas: " + minEquipas);
        if(calc < minEquipas && minEquipasIter <= maxEquipas){
            // Verifica se o valor iteractivo é maior que o número minimo de equipas, é que se não for, não é possível
            // fazer a distribuição/redução dos ultimos campos para preencher o requisito de equipas minimas por campo.
            // verifica também se existem número de campos suficientes para poder fazer a redução no número das equipas para compensar
            // os campos que fiquem com menos do número minimo das equipas requeridas no torneio. Se existirem campos suficientes para fazer
            // a redução econtrou-se o número de campos necessários para fazer a distribuição das equipas pelos campos 
            //console.log("xpto: " + (numCampos-(minEquipas - calc)));
            if(minEquipasIter > minEquipas && (numCampos-(minEquipas - calc)) < numCampos){
                //console.log("aqui found 2");
                found = true;
            } else {
                //console.log("aqui ++");
                minEquipasIter++;
            }
        } else {
            //console.log("aqui found 1");
            found = true;
        }
    }

    numCampos = Math.ceil(numEquipas / minEquipasIter);

    if(numCamposTorneio > numCampos){
        return numCampos;
    } else {
        return numCamposTorneio;
    }
}*/

function metodoEmparelhamento(equipas){

    const equipas2 = [[0,1]];
    const equipas3 = [[0,1],[0,2],[1,2]];
    const equipas4 = [[1,0],[2,3],[0,2],[3,1],[3,0],[2,1]];
    const equipas5 = [[1,0],[2,4],[0,2],[4,3],[3,0],[2,1],[0,4],[1,3],[4,1],[3,2]];
    const equipas6 = [[1,0],[2,4],[3,5],[0,2],[5,1],[4,3],[3,0],[2,1],[5,4],[0,4],[1,3],[2,5],[5,0],[4,1],[3,2]];
    // TODO: emparelhamento até 12 equipas e limitar o número max de equipas ao número de emparelhamentos disponíveis

    let emparelhamento = null;

    switch(equipas.length){
        case 2 :
            emparelhamento = equipas2;
            break;
        case 3 :
            emparelhamento = equipas3;
            break;
        case 4 :
            emparelhamento = equipas4;
            break;
        case 5 :
            emparelhamento = equipas5;
            break;
        case 6 :
            emparelhamento = equipas6;
            break;
        default:
            emparelhamento = null;
            break;    
    }

    return emparelhamento;
}

function shuffleLocalidades(listaLocalidades) {
    const localidades = [];

    while(listaLocalidades.length > 0){
        let numLocalidades = listaLocalidades.length;
        const randomLocalidade = Math.floor(Math.random() * numLocalidades);

        localidades.push(listaLocalidades[randomLocalidade]);
        listaLocalidades.splice(randomLocalidade, 1);

    }
    return localidades;
}

function procuraEquipa(listaEquipas, equipaId){
    for(let i = 0; i < listaEquipas.length; i++){
        if(listaEquipas[i].equipaId == equipaId){
            return listaEquipas[i];
        }
    }
    return null;
}

function procuraEquipaIndex(listaEquipas, equipaId){
    let k = -1;
    for(let i = 0; i < listaEquipas.length; i++){
        if(listaEquipas[i].equipaId == equipaId){
            return i;
        }
    }
    return k;
}

exports.distribuiEquipasPorCampos = async function(torneioId, escalao = 0){
    // Inicializa a lista de escalões
    // Se o escalão estiver definido apenas esse escalão fica no array
    let escaloes = [];
    if(escalao == 0){
        // Todos os escalões que têm equipas
        const listaEscaloes = await dbFunctions.getEscaloesComEquipas(torneioId);
        escaloes = listaEscaloes.map(escalao => escalao.escalaoId);
    } else {
        escaloes.push(parseInt(escalao));
    }

    const escaloesDistribuidos = [];

    for await (const escalaoId of escaloes){

        // 1. Obter a lista de equipas e respectivo número de equipas que corresponde ao tamanho do array da lista de equipas
        const equipas = await dbFunctions.getEquipasPorEscalao(torneioId, escalaoId);
        const numEquipasPorEscalao = equipas.length;

        // Se só existem 2 equipas então o jogo é decisão do vencedor
        if(numEquipasPorEscalao == 2){
            try {
                await dbFunctions.createJogo(torneioId, escalaoId, 100, 1, equipas[0].equipaId, equipas[1].equipaId);
                const distribuido = {
                    escalao: escalaoId,
                    sucesso: true
                }
                escaloesDistribuidos.push(distribuido);
            } catch(err) {
                console.log("ERRO::Distribuição de Equipas:");
                console.log(err);
                const distribuido = {
                    escalao: escalaoId,
                    sucesso: false
                }
                escaloesDistribuidos.push(distribuido);
            }

        // Existem mais que duas equipas, distribuir equipas
        } else if(numEquipasPorEscalao > 2) {

            // Obtem o número de campos, mínimo de equipas e máximo de equipas para cada escalão
            const _camposInfo = dbFunctions.getNumeroCamposPorEscalao(torneioId, escalaoId);
            // 4. Por cada localidade distribuir as respectivas equipas pelos campos
            const _listaLocalidades = dbFunctions.getAllLocalidadesID();

            let [camposInfo, listaLocalidades] = await Promise.all([_camposInfo, _listaLocalidades]);

            // Define o número de campos, min e max de equipas por campo
            const numCampos = (camposInfo !== null) ? camposInfo.numCampos : 0;
            const minEquipas = (camposInfo !== null) ? camposInfo.minEquipas : 0;
            const maxEquipas = (camposInfo !== null) ? camposInfo.maxEquipas : 0;

            //Baralha as localidades para não haver sempre a mesma ordenação das equipas
            listaLocalidades = shuffleLocalidades(listaLocalidades);

            // Verifica se existem equipas suficientes para preencher o número de campos do escalão
            // cumprindo o requisito do minímo e máximo de equipas e campos > 0
            if(numEquipasPorEscalao < numCampos * minEquipas || numEquipasPorEscalao > numCampos * maxEquipas || numCampos == 0)
            {
                const distribuido = {
                    escalao: escalaoId,
                    sucesso: false
                }
                escaloesDistribuidos.push(distribuido);
                continue;
            }

            // Inicia a Array de campos
            let listaCampos = [];
            for(let i = 0; i < numCampos; i++){
                listaCampos.push(new Array());
            }

            // Atribui as equipas aos campos
            let k = 0;
            for(const localidade of listaLocalidades){
                const numEquipasPorLocalidade = await dbFunctions.getNumEquipasPorLocalidadeAndEscalao(torneioId, localidade.localidadeId, escalaoId);

                if(numEquipasPorLocalidade > 0){
                    const listaEquipasPorLocalidade = await dbFunctions.getEquipasIDByLocalidadeAndEscalao(torneioId, localidade.localidadeId, escalaoId);

                    // Adiciona a equipa à lista de campos
                    for(const equipa of listaEquipasPorLocalidade){
                        if(k >= numCampos){
                            k = 0;
                        }

                        listaCampos[k].push(equipa);
                        k++;
                    }
                }
            }

            // Faz o emparelhamento das equipas por cada campo
            const listaJogos = [];
            for(i = 0; i < listaCampos.length; i++){
                let emparelhamento = metodoEmparelhamento(listaCampos[i]);
                for(const par of emparelhamento){
                    let equipa1 = listaCampos[i][par[0]];
                    let equipa2 = listaCampos[i][par[1]];

                    listaJogos.push(dbFunctions.createJogo(torneioId, escalaoId, 1, (i+1), equipa1.equipaId, equipa2.equipaId));
                }
            }

            try {
                const transaction = await sequelize.transaction();
                // Regista os Jogos na Base de dados
                await Promise.all(listaJogos, { transaction });
                await transaction.commit();

                const distribuido = {
                    escalao: escalaoId,
                    sucesso: true
                }
                escaloesDistribuidos.push(distribuido);
            } catch(err){
                await transaction.rollback();
                console.log("ERRO::Distribuição de Equipas:");
                console.log(err);
                const distribuido = {
                    escalao: escalaoId,
                    sucesso: false
                }
                escaloesDistribuidos.push(distribuido);
            }
        } else {
            continue;
        }
    }
    // Retorna informação sobre que escalões foram distribuidos com sucesso e os que não foram
    return escaloesDistribuidos;
}

exports.processaEquipas = async function(torneioId, listaJogos){ 
    try{
        const jogos = [];
        for(const jogo of listaJogos){
            const jogoId = jogo.jogoId;
            const equipa1Id = jogo.equipa1Id;
            const equipa2Id = jogo.equipa2Id;

            const _equipa1Info = await dbFunctions.getEquipa(torneioId, equipa1Id);
            const _equipa2Info = await dbFunctions.getEquipa(torneioId, equipa2Id);

            const [equipa1Info, equipa2Info] = await Promise.all([_equipa1Info, _equipa2Info]);
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
        }

        return jogos;
    } catch(err){
        console.log(err);
        return Promise.reject();
    }
}

exports.verificaCamposCompletos = async function(listaCampos, torneioId, escalaoId, fase){
    try {
        for(const campo of listaCampos){
            // Otem o número total dos jogos do campo
            const _numTotalJogos = dbFunctions.getNumGamesPorCampo(torneioId, escalaoId, fase, campo.campo);
            // Obtem a lista de jogos que já foram jogados
            const _listaJogosFinalizados = dbFunctions.getAllGamesPlayed(torneioId, escalaoId, fase, campo.campo);
    
            const [numTotalJogos, listaJogosFinalizados] = await Promise.all([_numTotalJogos, _listaJogosFinalizados]);
            if(numTotalJogos - listaJogosFinalizados.length == 0){
                campo.campoCompleto = true;
            } else {
                campo.campoCompleto = false;
            }
        }
    
        return listaCampos;
    } catch(err){
        console.log(err);
        return Promise.reject();
    }
}

exports.processaPontuacao = function(data){
    let equipa1Pontos = 0;
    let equipa2Pontos = 0;
    let vitoriasEquipa1 = 0;
    let vitoriasEquipa2 = 0;

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

exports.ordenaClassificacao = function(classificacao, listaJogos){
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
                    if(jogo.equipa1Id === a.equipaId){
                        return -1;
                    } else {
                        return 1;
                    }
                } else {
                    if(jogo.equipa2Id === a.equipaId){
                        return -1;
                    } else {
                        return 1;
                    }
                }
            } else {
                return 1;
            }
        } else {
            return 1;
        }
    });
}

exports.processaClassificacao = async function(torneioId, escalaoId, fase, campo = 0){
    try {
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

        const listaCompletaEquipas = await dbFunctions.getAllEquipasEscalao(torneioId, escalaoId);

        for(const campo of listaCampos){
            const numCampo = campo.campo;

            // 1. Obter a lista de Jogos para cada campo
            const listaJogos = await dbFunctions.getAllGamesPorCampo(torneioId, escalaoId, fase, numCampo);
            campo.classificacao = [];
            const classificacao = campo.classificacao;
            //const listaEquipas = new Set();

            // 2. Percorre a lista de jogos e coloca as equipas na lista de classificação
            for(const jogo of listaJogos){
                const equipa1 = procuraEquipa(listaCompletaEquipas, jogo.equipa1Id);
                const equipa2 = procuraEquipa(listaCompletaEquipas, jogo.equipa2Id);

                const posicaoEquipa1 = procuraEquipaIndex(classificacao, jogo.equipa1Id);
                if(posicaoEquipa1 != -1){
                    classificacao[posicaoEquipa1].vitorias = (jogo.equipa1Pontos > jogo.equipa2Pontos) ? classificacao[posicaoEquipa1].vitorias = classificacao[posicaoEquipa1].vitorias + 1 : classificacao[posicaoEquipa1].vitorias;
                    classificacao[posicaoEquipa1].pontos = classificacao[posicaoEquipa1].pontos + jogo.equipa1Pontos;
                } else {
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

                const posicaoEquipa2 = procuraEquipaIndex(classificacao, jogo.equipa2Id);
                if(posicaoEquipa2 != -1){
                    classificacao[posicaoEquipa2].vitorias = (jogo.equipa2Pontos > jogo.equipa1Pontos) ? classificacao[posicaoEquipa2].vitorias = classificacao[posicaoEquipa2].vitorias + 1 : classificacao[posicaoEquipa2].vitorias;
                    classificacao[posicaoEquipa2].pontos = classificacao[posicaoEquipa2].pontos + jogo.equipa2Pontos;
                } else {
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
            exports.ordenaClassificacao(classificacao, listaJogos);
        }
        return listaCampos;
    } catch(err) {
        console.log(err);
        return Promise.reject(err);
    }
}

