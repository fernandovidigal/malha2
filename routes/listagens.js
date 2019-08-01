const express = require('express');
const router = express.Router();
const { userAuthenticated } = require('../helpers/auth');
const { check } = require('express-validator/check');
const ListagensController = require('../controllers/listagens');

router.all('/*', userAuthenticated, (req, res, next) => {
    next();
});

router.get('/', ListagensController.mostraListagens);

router.post('/numEquipasPorConcelho', ListagensController.numEquipasPorConcelho);

router.post('/equipasAgrupadasPorCampos', ListagensController.equipasAgrupadasPorCampos);

// API
router.get('/getFases/:escalao', ListagensController.getFases);

router.get('/getCampos/:escalao/:fase', ListagensController.getCampos);

router.get('/getEquipas/:escalao', ListagensController.getEquipas);

router.get('/getNumEquipasPorConcelho/:escalao', ListagensController.getNumEquipasPorConcelho);

router.get('/equipasAgrupadasPorCampos/:escalao/:fase', ListagensController.getEquipasAgrupadasPorCampos);

router.get('/getFichasJogo/:escalao/:campo/:fase?', ListagensController.getFichasJogo);

router.get('/getClassificacao/:escalao/:campo/:fase?', ListagensController.getClassificacao);

module.exports = router;