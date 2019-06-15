const express = require('express');
const router = express.Router();
const { userAuthenticated, checkAdminStatus } = require('../../helpers/auth');
const { check } = require('express-validator/check');
const LocalidadesController = require('../../controllers/admin/localidades');

router.all('/*', [userAuthenticated, checkAdminStatus], (req, res, next) => {
    next();
});

router.get('/', LocalidadesController.getAllLocalidades);

router.get('/adicionarLocalidade', (req, res) => {
    res.render('admin/adicionarLocalidade');
});

router.post('/adicionarLocalidade', [
    check('localidade').trim().escape().not().isEmpty().withMessage('Deve indicar o nome da localidade'),
    check('localidade').escape().matches(/^[^0-9]+$/).withMessage('Nome da localidade inválido')
], LocalidadesController.createLocalidade);

router.get('/editarLocalidade/:id', LocalidadesController.getLocalidade);

router.put('/editarLocalidade/:id', [
    check('localidade').trim().escape().not().isEmpty().withMessage('Deve indicar o nome da localidade'),
    check('localidade').escape().matches(/^[^0-9]+$/).withMessage('Nome da localidade inválido')
], LocalidadesController.updateLocalidade);

// APAGAR LOCALIDADE
router.delete('/deleteLocalidade', LocalidadesController.deleteLocalidade);

module.exports = router;