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
        const localidadesWebSincronizar = [];
        const localidadesAppSincronizar = [];
        const localidadeWebEliminada = [];
        const localidadesAppComDefeito = [];
        const localidadesWebComDefeito = [];

        const localidadesAppNaoSincronizadas = localidadesApp.filter(lapp => lapp.syncWeb == null);
        console.log(localidadesAppNaoSincronizadas);
    } catch(error) {
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