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

router.post('/definirPorta', [
    check('porta').trim().escape().not().isEmpty().withMessage('Servidor: Deve indicar o número da Porta'),
    check('porta').trim().escape().matches(/^[0-9]+$/).withMessage('Servidor: Número da porta inválido')
], ConfiguracoesController.writeConfigServerPorta);

module.exports = router;