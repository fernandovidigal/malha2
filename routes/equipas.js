const express = require('express');
const router = express.Router();
const { userAuthenticated } = require('../helpers/auth');
const { check } = require('express-validator/check');
const EquipasController = require('../controllers/equipas');

router.all('/*', userAuthenticated, (req, res, next) => {
    next();
});

router.get('/', EquipasController.getAllEquipas);

router.get('/adicionarEquipa', EquipasController.adicionarEquipa);

router.post('/adicionarEquipa', [
    check('primeiro_elemento').trim().escape().not().isEmpty().withMessage('Deve indicar o nome do primeiro elemento da equipa.'),
    check('primeiro_elemento').trim().escape().matches(/^[^0-9]+$/).withMessage('Nome do primeiro elemento inválido.'),
    check('segundo_elemento').trim().escape().not().isEmpty().withMessage('Deve indicar o nome do segundo elemento da equipa.'),
    check('segundo_elemento').trim().escape().matches(/^[^0-9]+$/).withMessage('Nome do segundo elemento inválido.'),
    check('localidade').not().equals('').withMessage('Deve selecionar a localidade da equipa.'),
    check('escalao').exists().withMessage('Deve selecionar o escalão ao qual pertence a equipa.')
], EquipasController.createEquipa);

router.get('/editarEquipa/:id/torneio/:torneioId', EquipasController.getEquipaToEdit);

router.put('/editarEquipa/:id/torneio/:torneioId', [
    check('primeiro_elemento').trim().escape().not().isEmpty().withMessage('Deve indicar o nome do primeiro elemento da equipa.'),
    check('primeiro_elemento').trim().escape().matches(/^[^0-9]+$/).withMessage('Nome do primeiro elemento inválido.'),
    check('segundo_elemento').trim().escape().not().isEmpty().withMessage('Deve indicar o nome do segundo elemento da equipa.'),
    check('segundo_elemento').trim().escape().matches(/^[^0-9]+$/).withMessage('Nome do segundo elemento inválido.'),
    check('localidade').not().equals('').withMessage('Deve selecionar a localidade da equipa.'),
    check('escalao').exists().withMessage('Deve selecionar o escalão ao qual pertence a equipa.')
], EquipasController.updateEquipa);

router.get('/eliminarEquipa/:id', EquipasController.getEquipaToDelete);

router.delete('/eliminarEquipa/:id', EquipasController.deleteEquipa);

// Pesquisa de equipas
router.post('/pesquisa', [
    check('pesquisaEquipaId').trim().escape().not().isEmpty().withMessage('Deve indicar o Nº da Equipa a pesquisar.'),
    check('pesquisaEquipaId').trim().escape().matches(/^[0-9]+$/).withMessage('Nº da Equipa inválido.')
], EquipasController.searchEquipa);

// FAKER
// Gera equipa aleatóriamente
router.get('/faker/:num', EquipasController.createEquipasAleatoriamente);

router.get('/faker/:num/:escalao', EquipasController.createEquipasAleatoriamentePorEscalao);

module.exports = router;