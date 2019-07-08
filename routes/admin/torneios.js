const express = require('express');
const router = express.Router();
const { userAuthenticated, checkGestorStatus } = require('../../helpers/auth');
const { check} = require('express-validator/check');
const TorneiosController = require('../../controllers/admin/torneios');

router.all('/*', [userAuthenticated, checkGestorStatus], (req, res, next) => {
    next();
});

router.get('/', TorneiosController.getAllTorneios);

router.get('/adicionarTorneio', (req, res) => {
    res.render('admin/adicionarTorneio');
});

router.post('/adicionarTorneio', [
    check('designacao').not().isEmpty().withMessage('Deve indicar a designação do torneio.'),
    check('localidade').not().isEmpty().withMessage('Deve indicar a localidade do torneio.'),
    check('localidade').matches(/^[^0-9]+$/).withMessage('Nome da localidade inválido'),
    check('ano').not().isEmpty().withMessage('Deve indicar o ano do torneio.'),
    check('ano').isNumeric().isLength({ min: 4, max:4 }).withMessage('Ano do torneio inválido'),
    check('campos').optional({ checkFalsy: true }).isNumeric().withMessage('Número de campos inválido')
], TorneiosController.createTorneio);

router.get('/activaTorneio/:id', TorneiosController.ActivaTorneio);

router.get('/editarTorneio/:id', TorneiosController.getTorneio);

router.put('/editarTorneio/:id', [
    check('designacao').not().isEmpty().withMessage('Deve indicar a designação do torneio.'),
    check('localidade').not().isEmpty().withMessage('Deve indicar a localidade do torneio.'),
    check('localidade').matches(/^[^0-9]+$/).withMessage('Nome da localidade inválido'),
    check('ano').not().isEmpty().withMessage('Deve indicar o ano do torneio.'),
    check('ano').isNumeric().isLength({ min: 4, max:4 }).withMessage('Ano do torneio inválido'),
    check('campos').optional({ checkFalsy: true }).isNumeric().withMessage('Número de campos inválido')
] ,TorneiosController.updateTorneio);

router.delete('/deleteTorneio', TorneiosController.deleteTorneio);

module.exports = router;