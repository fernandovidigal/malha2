const express = require('express');
const router = express.Router();
const { userAuthenticated, checkAdminStatus } = require('../../helpers/auth');
const { check } = require('express-validator/check');
const TorneiosController = require('../../controllers/admin/torneios');

router.all('/*', [userAuthenticated, checkAdminStatus], (req, res, next) => {
    next();
});

router.get('/', TorneiosController.getAllTorneios);

module.exports = router;