const express = require('express');
const router = express.Router();
const { userAuthenticated, checkAdminStatus } = require('../../helpers/auth');
const SincronizacaoController = require('../../controllers/admin/sincronizacao');

router.all('/*', [userAuthenticated, checkAdminStatus], (req, res, next) => {
    res.locals.menuAdminSincronizacao = true;
    req.breadcrumbs('Sincronização', '/admin/sincronizacao');
    next();
});

router.get('/', SincronizacaoController.init);

module.exports = router;