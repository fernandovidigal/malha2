const axios = require('axios');
const dbFunctions = require('../DBFunctions');
const Localidades = require('../../models/Localidades');

const apiKey = 'LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy';

exports.syncLocalidades = async (url) => {
    try {
        const _responseWeb = axios.get(`${url}localidades/get.php?key=${apiKey}`);
        const _localidadesApp = dbFunctions.getAllLocalidades();

        const [responseWeb, localidadesApp] = await Promise.all([_responseWeb, _localidadesApp]);
        if (!responseWeb.data.sucesso){
            throw new Error();
        }

        const localidadesWeb = [];
        for(localidade of responseWeb.data.data){
            localidadesWeb.push({
                nome: localidade.nome,
                uuid: localidade.uuid,
                hash: localidade.hash
            });
        }

        await Localidades.bulkCreate(localidadesWeb, {
            updateOnDuplicate: ['uuid']
        });

        return true;
    } catch(error) {
        throw error;
    }
}