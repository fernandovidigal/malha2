const axios = require('axios');
const dbFunctions = require('../helpers/DBFunctions');

const apiKey = 'LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy';

/*async function syncLocalidades(url){
    try {
        const _responseWeb = axios.get(`${url}api/localidades/read.php?key=${apiKey}`);
        const _localidadesApp = dbFunctions.getAllLocalidades();

        const [responseWeb, localidadesApp] = await Promise.all([_responseWeb, _localidadesApp]);
        if (!responseWeb.data.sucesso){
            throw new Error();
        }

        const localidadesWeb = responseWeb.data.data;

        // Remove das listas as localidades que já estão sincronizadas
        const localidadesAppSincronizar = [];
        const localidadesAppComDefeito = [];
        const localidadesWebComDefeito = [];

        localidadesApp.forEach(lapp => {
            const index = localidadesWeb.findIndex(lweb => lweb.syncWeb == lapp.syncWeb);
            // Foi encontrado um elemento igual
            if(index != -1) {
                // Verifica se a localidade tem defeitos na sincronização, ou seja, algum dos elementos syncWeb ou syncApp não é 1
                // Verifica primeiro na Aplicação
                if(lapp.syncApp != 1 || lapp.syncWeb != 1){
                    localidadesAppComDefeito.push(lapp);
                }
                // Verifica na web
                if(localidadesWeb[index].syncApp != 1 || localidadesWeb[index].syncWeb != 1){
                    localidadesWebComDefeito.push(localidadesWeb[index]);
                }
                // Se tiver defeito de sincronização a localidade já está na array localidadesComDefeitoDeSincronizacao
                // Se não tiver defeito de sincronização é removida da array localidadesWeb, uma vez que já está sincronizada
                // e assim a array fica só com as localidades da Web que ainda não estão sincronizadas
                localidadesWeb.splice(index, 1);
            } else {
                // não foi entrada na web uma localidade igual então adiciona para sincronizar
                localidadesAppSincronizar.push(lapp);
            }
        });

        // Corrige defeito na sincronização
        // Percorre, primeiro da App depois da Web, as listas de localidades com defeito e adiciona-as ao array localidadesASincronizar
        // para serem executadas paralelamente
        const localidadesASincronizar = [];
        localidadesAppComDefeito.forEach(_localidade => {
            localidadesASincronizar.push(dbFunctions.updateLocalidadeSync(_localidade.localidadeId, 1, 1));
        });
        localidadesWebComDefeito.forEach(_localidade => {
            localidadesASincronizar.push(axios.post(`${url}api/localidades/updateSync.php?key=${apiKey}`, {
                localidadeId: _localidade.localidadeId,
                appValue: 1,
                webValue: 1
            }));
        });

        if(localidadesAppSincronizar.length > 0){
            for(const localidade of localidadesAppSincronizar){
                // Se na app existe localidade com 1 1, então é porque na web foi apaga a localidade
                // ou seja, não foi encontrada na web localidade igual, mas na App a localidades está como estando sincronizada
                if(localidade.syncApp == 1 && localidade.syncWeb == 1){
                    const numEquipas = await dbFunctions.getNumEquipasPorFiltro({ localidadeId: localidade.localidadeId });
                    // Se existem equipas na app não se pode apagar a localidade, então regista a localidade na web
                    if(numEquipas > 0){
                        localidadesASincronizar.push(axios.post(`${url}api/localidades/create.php?key=${apiKey}`, {
                            nome: localidade.nome,
                            syncHash: localidade.syncHash,
                            appValue: 1,
                            webValue: 1
                        }));
                    } else {
                        // Não existem equipas na App para a dada localidade, apagar localidade também na App
                        localidadesASincronizar.push(dbFunctions.deleteLocalidade(localidade.localidadeId));
                    }
                } else {
                    localidadesASincronizar.push(axios.post(`${url}api/localidades/create.php?key=${apiKey}`, {
                        nome: localidade.nome,
                        syncHash: localidade.syncHash,
                        appValue: 1,
                        webValue: 1
                    }));
                    localidadesASincronizar.push(dbFunctions.updateLocalidadeSyncWeb(localidade.localidadeId, 1));
                }
            }
        }
        
        if(localidadesWeb.length > 0) {
            for(const localidade of localidadesWeb){
                if(localidade.syncApp == 1 && localidade.syncWeb == 1){
                    const response = await axios.get(`${url}api/equipas/numEquipas.php?key=${apiKey}&localidadeId=${localidade.localidadeId}`);
                    if(response.data.numEquipas > 0) {
                        localidadesASincronizar.push(dbFunctions.createLocalidade(localidade.nome, localidade.syncHash, localidade.syncApp, localidade.syncWeb));
                    } else {
                        localidadesASincronizar.push(axios.post(`${url}api/localidades/delete.php?key=${apiKey}`, {
                            localidadeId: localidade.localidadeId,
                        }));
                    }
                } else {
                    localidadesASincronizar.push(axios.post(`${url}api/localidades/updateSyncApp.php?key=${apiKey}`, {
                        localidadeId: localidade.localidadeId,
                        value: 1
                    }));
                    localidadesASincronizar.push(dbFunctions.createLocalidade(localidade.nome, localidade.syncHash, 1, 1));
                }
            }
        }

        // Sincroniza todas as localidades paralelamente
        await Promise.all(localidadesASincronizar);

    } catch(error) {
        return false;
    }
}*/

async function syncLocalidades(url){
    try {
        const _responseWeb = axios.get(`${url}api/localidades/read.php?key=${apiKey}`);
        const _localidadesApp = dbFunctions.getAllLocalidades();

        const [responseWeb, localidadesApp] = await Promise.all([_responseWeb, _localidadesApp]);
        if (!responseWeb.data.sucesso){
            throw new Error();
        }

        const localidadesWeb = responseWeb.data.data;

        // Remove das listas as localidades que já estão sincronizadas
        const localidadesAppSincronizar = [];
        const localidadesIguaisSincronizar = [];
        const localidadesComDefeito = [];

        localidadesApp.forEach(lapp => {
            // Verificar se a localidade existe na Web
            const webIndex = localidadesWeb.findIndex(lweb => lweb.syncWeb == lapp.syncApp);

            if(webIndex != -1){
                // Foi encontrada a mesma localidade na APP e na WEB
                if(lapp.syncWeb == null && localidadesWeb[webIndex].syncApp == null){
                    // A localidade existe na APP e na WEB, mas ainda não está sincronizada
                    const localidadesIguaisASincronizar = [];
                    // Cria-se uma array de arrays [[localidadeApp, localidadeWeb], [localidadeApp, localidadeWeb]]
                    localidadesIguaisASincronizar.push({lapp: lapp});
                    localidadesIguaisASincronizar.push({lweb: localidadesWeb[webIndex]});

                    localidadesIguaisSincronizar.push(localidadesIguaisASincronizar);
                } else {
                    // SyncWeb e/ou SyncApp é diferente de null
                    if(lapp.syncWeb != localidadesWeb[webIndex].syncApp){
                        localidadesComDefeito.push([{lapp: lapp}, {lweb: localidadesWeb[webIndex]}]);
                    }
                }
                // Remove-se a localidade da lista da web, ou seja, as localidades
                // que ficarem restantes é éporque não existem na App e têm de ser sincronizadas
                localidadesWeb.splice(webIndex, 1);
            } else { 
                // A localidade não existe na web
                // Então sincroniza-se nos dois lados
                localidadesAppSincronizar.push(lapp);
            }
        });
        
        console.log("Localidade A sincronizar");
        console.log(localidadesAppSincronizar);
        console.log("Localidade iguais mas estão desincronizadas");
        console.log(localidadesIguaisSincronizar);
        console.log("Localidade com defeito");
        console.log(localidadesComDefeito);
        console.log("Localidade WEB");
        console.log(localidadesWeb);

        const localidadesASincronizar = [];

        // SINCRONIZA localidades da APP que não estão sincronizadas
        localidadesAppSincronizar.forEach(async localidade => {
            // Verifica se syncWeb não é nulo, ou seja, senão é nulo então a 
            // localidade já tinha sido sincronizada e foi eliminada na Web
            if(localidade.syncWeb != null){
                // A localidade foi editada ou sejas as flags sync são diferentes
                if(localidade.syncWeb != localidade.syncApp){
                    // Neste ponto não encontrou a localidade editada (por isso tem sync diferente) na Web
                    // cria a localidade na web e actualiza a hash na app
                    localidadesASincronizar.push(axios.post(`${url}api/localidades/create.php?key=${apiKey}`, {
                        nome: localidade.nome,
                        syncApp: localidade.syncApp,
                        syncWeb: localidade.syncApp
                    }));
                    localidadesASincronizar.push(dbFunctions.updateLocalidadeSync(localidade.localidadeId, localidade.syncApp, localidade.syncApp));
                } else {
                    // Verifica se existem equipas desta localidade registadas na App
                    const numEquipas = await dbFunctions.getNumEquipasPorFiltro({ localidadeId: localidade.localidadeId });
                    // Se existem equipas na app não se pode apagar a localidade, então regista a localidade na web
                    if(numEquipas > 0){
                        localidadesASincronizar.push(axios.post(`${url}api/localidades/create.php?key=${apiKey}`, {
                            nome: localidade.nome,
                            syncApp: localidade.syncApp,
                            syncWeb: localidade.syncApp
                        }));
                    } else {
                        // Não existem equipas na App para a dada localidade, apagar localidade também na App
                        // mas como syncWeb é != de null então tem de se apagar a localidade
                        localidadesASincronizar.push(dbFunctions.deleteLocalidade(localidade.localidadeId));
                    }
                }
            } else {
                // Adicionar a localidade à plataforma Web
                localidadesASincronizar.push(axios.post(`${url}api/localidades/create.php?key=${apiKey}`, {
                    nome: localidade.nome,
                    syncApp: localidade.syncApp,
                    syncWeb: localidade.syncApp
                }));
                // Actualiza a syncApp Hash na App
                localidadesASincronizar.push(dbFunctions.updateLocalidadeSync(localidade.localidadeId, localidade.syncApp, localidade.syncApp));
            }
            
        });

        // SINCRONIZA localidades da WEB que não estão sincronizadas
        localidadesWeb.forEach(async localidade => {
            // Verifica se syncWeb não é nulo, ou seja, senão é nulo então a 
            // localidade já tinha sido sincronizada e foi eliminada na Web
            if(localidade.syncApp != null){
                if(localidade.syncWeb != localidade.syncApp){
                    // actualiza as flags na 
                    localidadesASincronizar.push(axios.post(`${url}api/localidades/updateSyncApp.php?key=${apiKey}`, {
                        localidadeId: localidade.localidadeId,
                        syncApp: localidade.syncWeb
                    }));
                    localidadesASincronizar.push(dbFunctions.createLocalidade(localidade.nome, localidade.syncWeb, localidade.syncWeb));
                } else {
                    // Verifica se existem equipas desta localidade registadas na WEB
                    const response = await axios.get(`${url}api/equipas/numEquipas.php?key=${apiKey}&localidadeId=${localidade.localidadeId}`);
                    // Se existem equipas na web não se pode apagar a localidade, então regista a localidade na app
                    if(response.data.numEquipas > 0) {
                        localidadesASincronizar.push(dbFunctions.createLocalidade(localidade.nome, localidade.syncWeb, localidade.syncWeb));
                    } else {
                        // Não existem equipas na Web para a localidade, apagar localidade também na Web
                        localidadesASincronizar.push(axios.post(`${url}api/localidades/delete.php?key=${apiKey}`, {
                            localidadeId: localidade.localidadeId,
                        }));
                    }
                }
            } else {
                localidadesASincronizar.push(axios.post(`${url}api/localidades/updateSyncApp.php?key=${apiKey}`, {
                    localidadeId: localidade.localidadeId,
                    syncApp: localidade.syncWeb
                }));
                localidadesASincronizar.push(dbFunctions.createLocalidade(localidade.nome, localidade.syncWeb, localidade.syncWeb));
            }
        });

        localidadesIguaisSincronizar.forEach(localidades => {
            localidadesASincronizar.push(axios.post(`${url}api/localidades/updateSyncApp.php?key=${apiKey}`, {
                localidadeId: localidades[1].lweb.localidadeId,
                syncApp: localidades[0].lapp.syncApp
            }));
            localidadesASincronizar.push(dbFunctions.updateLocalidadeSyncWeb(localidades[0].lapp.localidadeId, localidades[1].lweb.syncWeb));
        });

        localidadesComDefeito.forEach(localidades => {
            // A localidade foi editada nos dois lados, mas é a mesma localidade
            // actualiza só as flags para corresponder
            localidadesASincronizar.push(axios.post(`${url}api/localidades/updateSyncApp.php?key=${apiKey}`, {
                localidadeId: localidades[1].lweb.localidadeId,
                syncApp: localidades[0].lapp.syncApp
            }));
            localidadesASincronizar.push(dbFunctions.updateLocalidadeSyncWeb(localidades[0].lapp.localidadeId, localidades[1].lweb.syncWeb));
        });
        // Sincroniza todas as localidades paralelamente
        await Promise.all(localidadesASincronizar);

    } catch(error) {
        console.log(error);
        return false;
    }
}

exports.checkConnection = async (url) => {
    try {
        const response = await axios.get(url + 'api/checkConnection.php');
        if(response.status == 200 && response.data.sucesso){
            return true;
        } else {
            throw new Error();
        }
    } catch (error){
        return false;
    }
}

exports.syncAll = async (url) => {
    try {
        console.log('syncAll');
        const syncedLocalidades = await syncLocalidades(url);
    } catch (error) {
        
    } 
}