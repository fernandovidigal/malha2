const axios = require('axios');
const { syncLocalidades } = require('./sync/localidades');
const { syncEscaloes } = require('./sync/escaloes');
const { syncTorneios } = require('./sync/torneios');

exports.checkConnection = async (req, res) => {
    try {
        const url = req.session.syncUrl;
        if(url == null){
            throw new Error();
        }
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

exports.checkActiveConnection = async (req, res, next) => {
    console.log("aqui");
    const url = req.session.syncUrl;
    try{
        if(url == null){
            throw new Error();
        }

        const response = await axios.get(url + 'checkConnection.php?key=Avrd45h6DbfFfNe4dBBTA34hrb5dfb5eBdbAMR37ff2gd4fD');
        if(response.data.sucesso){
            req.session.activeConnection = true;
            res.locals.activeConnection = true;
        } else {
            throw new Error();
        }
    } catch (error) {
        req.session.activeConnection = false;
        res.locals.activeConnection = false;
    }
    
    next();
}

exports.syncData = async (req, res, next) => {
    try {
        const url = req.session.syncUrl;
        

        // Fazer sincronização
        // Localidades
        await syncLocalidades(url);

        // Escalões
        //await syncEscaloes(url);
        
        // Torneios
        //await syncTorneios(url);

        res.status(200).json({ success: true });
    } catch (error) {
        console.log(error);
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