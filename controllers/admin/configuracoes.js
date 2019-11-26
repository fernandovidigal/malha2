const configFunctions = require('../../helpers/configFunctions');

exports.getConfig = async (req, res) => {
    try {
        const configData = await configFunctions.readConfigFile();
        if(!configData) throw new Error();
        
        res.render('admin/configuracoes', {config: configData, breadcrumbs: req.breadcrumbs()});
    } catch(err) {
        console.log(err);
        req.flash('error', 'Não foi possível carregar o ficheiro de configuração!')
        res.redirect('/admin');
    }
}

exports.writeConfigServerPorta = async (req, res) => {
    try {
        const configData = await configFunctions.readConfigFile();
        const inputPort = parseInt(req.body.serverPort);

        if(parseInt(configData.server.port) != inputPort){
            configData.server.port = parseInt(req.body.serverPort);
            await configFunctions.writeConfigFile(configData);
        }

        res.status(200).json({
            success: true
        });
    } catch (err) {
        res.status(404).json({
            success: false
        });
    }
}

exports.switchFaker = async (req, res) => {
    try {
        const configData = await configFunctions.readConfigFile();
        const onOffSwitch = (parseInt(req.body.switch) == 1) ? true : false;
        
        if(configData.faker != onOffSwitch){
            configData.faker = onOffSwitch;
            await configFunctions.writeConfigFile(configData);
        }

        res.status(200).json({
            success: true
        });
    } catch (err) {
        res.status(404).json({
            success: false
        });
    }
}