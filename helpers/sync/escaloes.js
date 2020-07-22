const axios = require('axios');
const dbFunctions = require('../DBFunctions');

const apiKey = 'LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy';

exports.syncEscaloes = async (url) => {
    try {
        const _responseWeb = axios.get(`${url}escaloes/read.php?key=${apiKey}`);
        const _escaloesApp = dbFunctions.getAllEscaloes();

        const [responseWeb, escaloesApp] = await Promise.all([_responseWeb, _escaloesApp]);
        if (!responseWeb.data.sucesso){
            throw new Error();
        }

        const escaloesWeb = responseWeb.data.data;

        const escaloesAppSincronizar = [];
        const escaloesIguaisSincronizar = [];
        const escaloesComDefeito = [];

        // Remove das listas os escaloes que já estão sincronizadas
        escaloesApp.forEach(eapp => {
            // Verificar se a localidade existe na Web
            const webIndex = escaloesWeb.findIndex(eweb => eweb.syncWeb == eapp.syncApp);

            if(webIndex != -1){
                // Foi encontrada o mesmo escalão na APP e na WEB
                if(eapp.syncWeb == null && escaloesWeb[webIndex].syncApp == null){
                    // O Escalão existe na APP e na WEB, mas ainda não está sincronizado
                    const escaloesIguaisASincronizar = [];
                    // Cria-se uma array de arrays [[escalaoApp, escalaoWeb], [escalaoApp, escalaoWeb]]
                    escaloesIguaisASincronizar.push({eapp: eapp});
                    escaloesIguaisASincronizar.push({eweb: escaloesWeb[webIndex]});

                    escaloesIguaisSincronizar.push(escaloesIguaisASincronizar);
                } else {
                    // SyncWeb e/ou SyncApp é diferente de null
                    if(eapp.syncWeb != escaloesWeb[webIndex].syncApp){
                        escaloesComDefeito.push([{eapp: eapp}, {eweb: escaloesWeb[webIndex]}]);
                    }
                }
                // Remove-se o escalao da lista da web, ou seja, os escaloes
                // que ficarem restantes é éporque não existem na App e têm de ser sincronizadas
                escaloesWeb.splice(webIndex, 1);
            } else { 
                // A localidade não existe na web
                // Então sincroniza-se nos dois lados
                escaloesAppSincronizar.push(eapp);
            }
        });

        // Todas os escalões a sincronizar com Promise.all
        const escaloesASincronizar = [];

        // SINCRONIZA escalões da APP que não estão sincronizadas
        escaloesAppSincronizar.forEach(async escalao => {
            // Verifica se syncWeb não é nulo, ou seja, senão é nulo então o 
            // escalão já tinha sido sincronizada e foi eliminada na Web
            if(escalao.syncWeb != null){
                // O escalão foi editada ou sejas as flags sync são diferentes
                if(escalao.syncWeb != escalao.syncApp){
                    // Neste ponto não encontrou o escalao editado (por isso tem sync diferente) na Web
                    // cria o escalao na web e actualiza a hash na app
                    escaloesASincronizar.push(axios.post(`${url}escaloes/create.php?key=${apiKey}`, {
                        designacao: escalao.nome,
                        sexo: escalao.sexo,
                        syncApp: escalao.syncApp,
                        syncWeb: escalao.syncApp
                    }));
                    escaloesASincronizar.push(dbFunctions.updateEscalaoSync(escalao.escalaoId, escalao.syncApp, escalao.syncApp));
                } else {
                    // Verifica se existem escaloes registados na App
                    const numEquipas = await dbFunctions.getNumEquipasPorFiltro({ escalaoId: escalao.escalaoId });
                    // Se existem escaloes na app não se pode apagar o escalao, então regista o escalao na web
                    if(numEquipas> 0){
                        escaloesASincronizar.push(axios.post(`${url}escaloes/create.php?key=${apiKey}`, {
                            designacao: escalao.designacao,
                            sexo: escalao.sexo,
                            syncApp: escalao.syncApp,
                            syncWeb: escalao.syncApp
                        }));
                    } else {
                        // Não existem equipas na App para o dado escalao, apagar escalão também na App
                        // mas como syncWeb é != de null então tem de se apagar o escalão
                        escaloesASincronizar.push(dbFunctions.deleteEscalao(escalao.escalaoId));
                    }
                }
            } else {
                // Adicionar o escalao à plataforma Web
                escaloesASincronizar.push(axios.post(`${url}escaloes/create.php?key=${apiKey}`, {
                    designacao: escalao.designacao,
                    sexo: escalao.sexo,
                    syncApp: escalao.syncApp,
                    syncWeb: escalao.syncApp
                }));
                // Actualiza a syncApp Hash na App
                escaloesASincronizar.push(dbFunctions.updateEscalaoSync(escalao.escalaoId, escalao.syncApp, escalao.syncApp));
            }
        });

        // SINCRONIZA escalões da WEB que não estão sincronizadas
        escaloesWeb.forEach(async escalao => {
            // Verifica se syncWeb não é nulo, ou seja, senão é nulo então o 
            // escalão já tinha sido sincronizada e foi eliminada na Web
            if(escalao.syncApp != null){
                if(escalao.syncWeb != escalao.syncApp){
                    // actualiza as flags na 
                    escaloesASincronizar.push(axios.post(`${url}escaloes/updateSyncApp.php?key=${apiKey}`, {
                        escalaoId: escalao.escalaoId,
                        syncApp: escalao.syncWeb
                    }));
                    escaloesASincronizar.push(dbFunctions.createEscalao(escalao.designacao, escalao.sexo, escalao.syncWeb, escalao.syncWeb));
                } else {
                    // Verifica se existem equipas deste escalao registadas na WEB
                    const response = await axios.get(`${url}equipas/numEquipas.php?key=${apiKey}&escalaoId=${escalao.escalaoId}`);
                    // Se existem equipas na web não se pode apagar o escalao, então regista o escalao na app
                    if(response.data.numEquipas > 0) {
                        escaloesASincronizar.push(dbFunctions.createEscalao(escalao.designacao, escalao.sexo, escalao.syncWeb, escalao.syncWeb));
                    } else {
                        // Não existem equipas na Web para o escalão, apagar o escalão também na Web
                        escaloesASincronizar.push(axios.post(`${url}escaloes/delete.php?key=${apiKey}`, {
                            escalaoId: escalao.escalaoId,
                        }));
                    }
                }
            } else {
                escaloesASincronizar.push(axios.post(`${url}escaloes/updateSyncApp.php?key=${apiKey}`, {
                    escalaoId: escalao.escalaoId,
                    syncApp: escalao.syncWeb
                }));
                escaloesASincronizar.push(dbFunctions.createEscalao(escalao.designacao, escalao.sexo, escalao.syncWeb, escalao.syncWeb));
            }
        });

        escaloesIguaisSincronizar.forEach(escaloes => {
            escaloesASincronizar.push(axios.post(`${url}escaloes/updateSyncApp.php?key=${apiKey}`, {
                escalaoId: escaloes[1].eweb.escalaoId,
                syncApp: escaloes[0].eapp.syncApp
            }));
            escaloesASincronizar.push(dbFunctions.updateEscalaoSyncWeb(escaloes[0].eapp.localidadeId, escaloes[1].eweb.syncWeb));
        });

        escaloesComDefeito.forEach(escaloes => {
            // O escalão foi editada nos dois lados, mas é o mesmo escalão
            // actualiza só as flags para corresponder
            escaloesASincronizar.push(axios.post(`${url}escaloes/updateSyncApp.php?key=${apiKey}`, {
                escalaoId: escaloes[1].eweb.escalaoId,
                syncApp: escaloes[0].eapp.syncApp
            }));
            escaloesASincronizar.push(dbFunctions.updateEscalaoSyncWeb(escaloes[0].eapp.localidadeId, escaloes[1].eweb.syncWeb));
        });

        // Sincroniza todas as localidades paralelamente
        await Promise.all(escaloesASincronizar);
        return true;
    } catch(error) {
        console.log(error);
        throw error;
    }
}