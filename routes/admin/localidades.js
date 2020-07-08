const express = require('express');
const router = express.Router();
const { userAuthenticated, checkGestorStatus } = require('../../helpers/auth');
const { check } = require('express-validator');
const LocalidadesController = require('../../controllers/admin/localidades');

router.all('/*', [userAuthenticated, checkGestorStatus], (req, res, next) => {
    res.locals.menuAdminLocalidades = true;
    req.breadcrumbs('Localidades', '/admin/localidades');
    next();
});

router.get('/', LocalidadesController.getAllLocalidades);

router.get('/adicionarLocalidade', (req, res) => {
    req.breadcrumbs('Adicionar Localidade', '/admin/adicionarLocalidade');
    res.render('admin/adicionarLocalidade', {breadcrumbs: req.breadcrumbs()});
});

router.post('/adicionarLocalidade', [
    check('localidade').trim().escape().not().isEmpty().withMessage('Deve indicar o nome da localidade'),
    check('localidade').trim().escape().matches(/^[^0-9]+$/).withMessage('Nome da localidade inválido')
], LocalidadesController.createLocalidade);

router.get('/editarLocalidade/:id', LocalidadesController.getLocalidade);

router.put('/editarLocalidade/:id', [
    check('localidade').trim().escape().not().isEmpty().withMessage('Deve indicar o nome da localidade'),
    check('localidade').trim().escape().matches(/^[^0-9]+$/).withMessage('Nome da localidade inválido')
], LocalidadesController.updateLocalidade);

// APAGAR LOCALIDADE
router.delete('/deleteLocalidade', LocalidadesController.deleteLocalidade);

module.exports = router;