const express = require('express');
const router = express.Router();
const { userAuthenticated } = require('../helpers/auth');
const { check } = require('express-validator/check');
const TorneiosController = require('../controllers/torneios');

router.all('/*', userAuthenticated, (req, res, next) => {
    next();
});

router.get('/', TorneiosController.getStarting);

router.post('/definirNumeroCampos', [
    check('numCampos').trim().escape().not().isEmpty().withMessage('Deve indicar número de campos do torneio.'),
    check('numCampos').trim().escape().matches(/^[0-9]+$/).withMessage('Número de campos inválido.')
], TorneiosController.setNumeroCampos);

module.exports = router;