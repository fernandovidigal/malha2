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

// API
router.get('/getNumEquipasPorConcelho/:escalao', ListagensController.getNumEquipasPorConcelho);

module.exports = router;