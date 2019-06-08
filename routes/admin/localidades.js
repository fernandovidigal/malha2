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
    check('localidade').not().isEmpty().withMessage('Deve indicar o nome da localidade'),
    check('localidade').isAlpha().withMessage('Nome da localidade inválido')
],LocalidadesController.createLocalidade);

module.exports = router;