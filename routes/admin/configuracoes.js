const express = require('express');
const router = express.Router();
const { userAuthenticated, checkAdminStatus } = require('../../helpers/auth');
const { check } = require('express-validator/check');
const ConfiguracoesController = require('../../controllers/admin/configuracoes');

router.all('/*', [userAuthenticated, checkAdminStatus], (req, res, next) => {
    res.locals.menuAdminConfig = true;
    req.breadcrumbs('Configuraçoes', '/admin/configuracoes');
    next();
});

router.get('/', ConfiguracoesController.getConfig);

router.put('/definirPorta', ConfiguracoesController.writeConfigServerPorta);

module.exports = router;