const { validationResult } = require('express-validator/check');
const configFunctions = require('../../helpers/configFunctions'); 

exports.getConfig = (req, res, next) => {
    configFunctions.readConfigFile()
    .then(data => {
        res.render('admin/configuracoes', {server: data.server});
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível carregar o ficheiro de configuração!')
        res.redirect('../');
    });
}

exports.writeConfigServerPorta = (req, res, next) => {
    const porta = req.body.porta.trim();
    const errors = validationResult(req);

    const _server = {
        server: {
            port: porta
        }  
    }

    if(!errors.isEmpty()){
        res.render('admin/configuracoes', {validationErrors: errors.array({onlyFirstError: true}), server: _server});
    } else {
        configFunctions.writeConfigFile(_server)
        .then(()=> {
            req.flash('success', 'Configuração gravada com sucesso.')
            res.redirect('/admin/configuracoes');
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Não foi possível gravar a configuração!')
            res.redirect('/admin/configuracoes');
        })
    }
}