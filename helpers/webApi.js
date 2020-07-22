const axios = require('axios');
const { syncLocalidades } = require('./sync/localidades');
const { syncEscaloes } = require('./sync/escaloes');

exports.checkConnection = async (req, res) => {
    try {
        const url = req.session.syncUrl;
        const response = await axios.get(url + 'checkConnection.php?key=Avrd45h6DbfFfNe4dBBTA34hrb5dfb5eBdbAMR37ff2gd4fD');
        if(response.data.sucesso){
            req.session.activeConnection = true;
            res.status(200).json({ success: true });
        } else {
            throw new Error();
        }
    } catch (error){
        res.status(200).json({ success: false });
    }
}

exports.syncData = async (req, res, next) => {
    try {
        const url = req.session.syncUrl;
        // 1. Verifica se existe conexão
        /*const connection = await this.checkConnection(url);
        if(!connection){
            throw new Error('Não existe ligação à plataforma Web');
        }*/
        

        // 2. Faz sincronização
        // Localidades
        await syncLocalidades(url);
        await syncEscaloes(url);

        res.status(200).json({ success: true });
    } catch (error) {
        let message = "Não foi possível efectuar a sincronização";
        if(error.message){
            message = error.message;
        }
        res.status(200).json({
            success: false,
            message: message
        });
    }
}