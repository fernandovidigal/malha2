const dbFunctions = require('./torneioDBFunctions');
const sequelize = require('../helpers/database');

function determinaNumeroTotalCampos(numEquipas, numCamposTorneio, minEquipas, maxEquipas){
    
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
}

function metodoEmparelhamento(equipas){

    const equipas2 = [[0,1]];
    const equipas3 = [[0,1],[0,2],[1,2]];
    const equipas4 = [[1,0],[2,3],[0,2],[3,1],[3,0],[2,1]];
    const equipas5 = [[1,0],[2,4],[0,2],[4,3],[3,0],[2,1],[0,4],[1,3],[4,1],[3,2]];
    const equipas6 = [[1,0],[2,4],[3,5],[0,2],[5,1],[4,3],[3,0],[2,1],[5,4],[0,4],[1,3],[2,5],[5,0],[4,1],[3,2]];
    // TODO: emparelhamento até 10 equipas e limitar o número max de equipas ao número de emparelhamentos disponíveis

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

exports.distribuiEquipasPorCampos = async function(torneioId, minEquipas, maxEquipas, escalao = 0){

    // Número de campos
    // Checked
    let numCamposTorneio = await dbFunctions.getNumCampos(torneioId);
    numCamposTorneio = numCamposTorneio.campos;
    //console.log(numCamposTorneio);

    // Todos os escalões que têm equipas
    const listaEscaloes = await dbFunctions.getEscaloesComEquipas(torneioId);
    let escaloes = Array.from(listaEscaloes, escalao => escalao.escalaoId);
    //console.log("Distribui Equipas: Escaloes ->");
    //console.log(escaloes);

    const escaloesDistribuidos = [];

    // Não foi definido nenhum escalão
    // Distribui todas as equipas de todos os escalões
    if(escalao == 0){
        // Percorre todos os escalões
        for(const escalaoId of escaloes){
            //console.log("Escalão: " + escalaoId);

            // 1. Verificar o número total de equipas de cada escalão
            const numEquipasPorEscalao = await dbFunctions.getNumEquipasPorEscalao(torneioId, escalaoId);
            //console.log("Número de equipas por Escalão: " + numEquipasPorEscalao);

            // Se só existem 2 equipas então o jogo é decisão do vencedor
            if(numEquipasPorEscalao == 2){
                const equipas = await dbFunctions.getEquipasPorEscalao(torneioId, escalaoId);
                // Regista jogo para determinar o vencedor
                dbFunctions.createJogo(torneioId, escalaoId, 100, 1000, equipas[0].equipaId, equipas[1].equipaId)
                .then(() => {
                    const distribuido = {
                        escalao: escalaoId,
                        sucesso: true
                    }
                    escaloesDistribuidos.push(distribuido);
                })
                .catch(err => {
                    console.log("ERRO::Distribuição de Equipas:");
                    console.log(err);
                    const distribuido = {
                        escalao: escalaoId,
                        sucesso: false
                    }
                    escaloesDistribuidos.push(distribuido);
                });

            } else if(numEquipasPorEscalao > 2) {
                // Existem mais que duas equipas, distribuir equipas

                // 2. Determinar o número máximo de campos necessário para cada escalão
                const numMaxCampos = determinaNumeroTotalCampos(numEquipasPorEscalao, numCamposTorneio, minEquipas, maxEquipas);
                //console.log("Número Máximo de campos: " + numMaxCampos);
                // TODO: Throw Error: quando o número de campos retornado é 0
                if(numMaxCampos == 0){
                    throw new Error('O número de campos deve ser superior a 0.');
                }
                
                // 3. Inicia a Array de campos
                let listaCampos = [];
                for(i = 0; i < numMaxCampos; i++){
                    listaCampos.push(new Array());
                }
                //console.log("Lista de Campos:");
                //console.log(listaCampos);

                // 4. Por cada localidade distribuir as respectivas equipas pelos campos
                let listaLocalidades = await dbFunctions.getAllLocalidadesID();

                // 5. Baralha as localidades
                listaLocalidades = shuffleLocalidades(listaLocalidades);
                //console.log("Lista Localidades:");
                //console.log(listaLocalidades);

                let k = 0;
                for(const localidade of listaLocalidades){
                    const numEquipasPorLocalidade = await dbFunctions.getNumEquipasPorLocalidadeAndEscalao(torneioId, localidade.localidadeId, escalaoId);
                    //console.log(numEquipasPorLocalidade);

                    if(numEquipasPorLocalidade > 0){
                        const listaEquipasPorLocalidade = await dbFunctions.getEquipasIDByLocalidadeAndEscalao(torneioId, localidade.localidadeId, escalaoId);
                        //console.log(listaEquipasPorLocalidade);

                        // Adiciona a equipa à lista de campos
                        for(const equipa of listaEquipasPorLocalidade){
                            if(k >= numMaxCampos){
                                k = 0;
                            }

                            listaCampos[k].push(equipa);
                            k++;
                        }
                    }
                }

                const listaJogos = [];
                for(i = 0; i < listaCampos.length; i++){
                    let emparelhamento = metodoEmparelhamento(listaCampos[i]);
                    for(const par of emparelhamento){
                        let equipa1 = listaCampos[i][par[0]];
                        let equipa2 = listaCampos[i][par[1]];

                        // TODO: experimentar Try {} catch {} block to gerir os erros
                        //await dbFunctions.createJogo(torneioId, escalaoId, 1, (i+1), equipa1.equipaId, equipa2.equipaId);
                        listaJogos.push(dbFunctions.createJogo(torneioId, escalaoId, 1, (i+1), equipa1.equipaId, equipa2.equipaId));
                    }
                }

                // Execute em transação o registo dos jogos
                sequelize.transaction(t => {
                    return Promise.all(listaJogos, { transaction: t });
                })
                .then(()=>{
                    const distribuido = {
                        escalao: escalaoId,
                        sucesso: true
                    }
                    escaloesDistribuidos.push(distribuido);
                })
                .catch(err => {
                    console.log("ERRO::Distribuição de Equipas:");
                    console.log(err);
                    const distribuido = {
                        escalao: escalaoId,
                        sucesso: false
                    }
                    escaloesDistribuidos.push(distribuido);
                });

            } else {
                continue;
            }
        }

    } else {
        const escalaoId = escalao;
        // Distribui equipas só do escalão passado como parametro
        // 1. Verificar o número total de equipas de cada escalão
        const numEquipasPorEscalao = await dbFunctions.getNumEquipasPorEscalao(torneioId, escalaoId);
        //console.log("Número de equipas por Escalão: " + numEquipasPorEscalao);

        // Se só existem 2 equipas então o jogo é decisão do vencedor
        if(numEquipasPorEscalao == 2){
            const equipas = await dbFunctions.getEquipasPorEscalao(torneioId, escalaoId);
            // Regista jogo para determinar o vencedor
            dbFunctions.createJogo(torneioId, escalaoId, 100, 1000, equipas[0].equipaId, equipas[1].equipaId)
            .then(() => {
                const distribuido = {
                    escalao: escalaoId,
                    sucesso: true
                }
                escaloesDistribuidos.push(distribuido);
            })
            .catch(err => {
                console.log("ERRO::Distribuição de Equipas:");
                console.log(err);
                const distribuido = {
                    escalao: escalaoId,
                    sucesso: false
                }
                escaloesDistribuidos.push(distribuido);
            });

        } else if(numEquipasPorEscalao > 2) {
            // Existem mais que duas equipas, distribuir equipas

            // 2. Determinar o número máximo de campos necessário para cada escalão
            const numMaxCampos = determinaNumeroTotalCampos(numEquipasPorEscalao, numCamposTorneio, minEquipas, maxEquipas);
            //console.log("Número Máximo de campos: " + numMaxCampos);
            
            // 3. Inicia a Array de campos
            let listaCampos = [];
            for(i = 0; i < numMaxCampos; i++){
                listaCampos.push(new Array());
            }

            // 4. Por cada localidade distribuir as respectivas equipas pelos campos
            let listaLocalidades = await dbFunctions.getAllLocalidadesID();

            // 5. Baralha as localidades
            listaLocalidades = shuffleLocalidades(listaLocalidades);

            let k = 0;
            for(const localidade of listaLocalidades){
                const numEquipasPorLocalidade = await dbFunctions.getNumEquipasPorLocalidadeAndEscalao(torneioId, localidade.localidadeId, escalaoId);

                if(numEquipasPorLocalidade > 0){
                    const listaEquipasPorLocalidade = await dbFunctions.getEquipasIDByLocalidadeAndEscalao(torneioId, localidade.localidadeId, escalaoId);

                    // Adiciona a equipa à lista de campos
                    for(const equipa of listaEquipasPorLocalidade){
                        if(k > (numMaxCampos-1)){
                            k = 0;
                        }

                        listaCampos[k].push(equipa);
                        k++;
                    }
                }
            }

            const listaJogos = [];
            for(i = 0; i < listaCampos.length; i++){
                let emparelhamento = metodoEmparelhamento(listaCampos[i]);
                for(const par of emparelhamento){
                    let equipa1 = listaCampos[i][par[0]];
                    let equipa2 = listaCampos[i][par[1]];

                    listaJogos.push(dbFunctions.createJogo(torneioId, escalaoId, 1, (i+1), equipa1.equipaId, equipa2.equipaId));
                }
            }

            // Execute em transação o registo dos jogos
            sequelize.transaction(t => {
                return Promise.all(listaJogos, { transaction: t });
            })
            .then(()=>{
                const distribuido = {
                    escalao: escalaoId,
                    sucesso: true
                }
                escaloesDistribuidos.push(distribuido);
            })
            .catch(err => {
                console.log("ERRO::Distribuição de Equipas:");
                console.log(err);
                const distribuido = {
                    escalao: escalaoId,
                    sucesso: false
                }
                escaloesDistribuidos.push(distribuido);
            });
        }
    }

    // Retorna informação sobre que escalões foram distribuidos com sucesso e os que não foram
    return escaloesDistribuidos;
}