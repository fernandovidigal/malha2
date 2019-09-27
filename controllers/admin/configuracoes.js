const { validationResult } = require('express-validator/check');
const configFunctions = require('../../helpers/configFunctions'); 

exports.getConfig = (req, res, next) => {
    configFunctions.readConfigFile()
    .then(data => {
        res.render('admin/configuracoes', {server: data.server, breadcrumbs: req.breadcrumbs()});
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível carregar o ficheiro de configuração!')
        res.redirect('../');
    });
}

exports.writeConfigServerPorta = async (req, res, next) => {
    try {
        const server = {
            server: {
                port: req.body.serverPort
            }  
        }

        const result = await configFunctions.writeConfigFile(server);
        res.status(200).json({
            success: true
        });

    } catch (err) {
        res.status(404).json({
            success: false
        });
    }
}