const axios = require('axios');
const { syncLocalidades} = require('./sync/localidades');

exports.checkConnection = async (url) => {
    try {
        const response = await axios.get(url + 'checkConnection.php?key=Avrd45h6DbfFfNe4dBBTA34hrb5dfb5eBdbAMR37ff2gd4fD');
        if(response.status == 200 && response.data.sucesso){
            return true;
        } else {
            throw new Error();
        }
    } catch (error){
        return false;
    }
}

exports.syncData = async (req, res, next) => {
    try {
        const url = req.session.syncUrl;
        // 1. Verifica se existe conexão
        const connection = await this.checkConnection(url);
        if(!connection){
            throw new Error('Não existe ligação à plataforma Web');
        }
        // 2. Faz sincronização
        await syncLocalidades(url);

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