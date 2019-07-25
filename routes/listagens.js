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
router.get('/getNumEquipasPorConcelho/:escalao', ListagensController.getNumEquipasPorConcelho);

router.get('/equipasAgrupadasPorCampos/:escalao/:fase', ListagensController.getEquipasAgrupadasPorCampos);

module.exports = router;