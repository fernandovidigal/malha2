const express = require('express');
const router = express.Router();
const { userAuthenticated } = require('../helpers/auth');
const { check } = require('express-validator/check');
const TorneiosController = require('../controllers/torneio');

router.all('/*', userAuthenticated, (req, res, next) => {
    next();
});

router.get('/', TorneiosController.getStarting);

router.post('/definirNumeroCampos');

router.post('/definirNumeroCampos', [
    check('numCampos').trim().escape().not().isEmpty().withMessage('Deve indicar número de campos do torneio.'),
    check('numCampos').trim().escape().matches(/^[0-9]+$/).withMessage('Número de campos inválido.')
], TorneiosController.setNumeroCampos);

// Distribuição de todas as equipas de todos os escalões
router.get('/distribuirTodasEquipas', TorneiosController.distribuirTodasEquipas);

router.get('/distribuirEquipasPorEscalao/escalao/:escalao', TorneiosController.distribuirEquipasPorEscalao);

// Resultados
router.get('/resultados/escalao/:escalao/fase/:fase/campo/:campo', TorneiosController.mostraResultados);

router.get('/processaProximaFase/escalao/:escalao', TorneiosController.processaProximaFase);

// Classificação
router.get('/classificacao/escalao/:escalao/fase/:fase/campo/:campo', TorneiosController.mostraClassificacao);

// API
router.post('/registaParciais', TorneiosController.createParciais);

router.post('/actualizaParciais', TorneiosController.updateParciais);

module.exports = router;