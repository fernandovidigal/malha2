const express = require('express');
const router = express.Router();
const { userAuthenticated } = require('../../helpers/auth');
const { check } = require('express-validator/check');
const UsersController = require('../../controllers/admin/utilizadores');

router.all('/*', userAuthenticated, (req, res, next) => {
    next();
});

router.get('/', UsersController.getAllUsers);

// ADICIONAR UTILIZADOR
router.get('/adicionarUtilizador', (req, res) => {
    res.render('admin/adicionarUtilizador');
});

router.post('/adicionarUtilizador', [
    check('username').not().isEmpty().withMessage('Deve indicar o nome de utilizador'),
    check('password').not().isEmpty().withMessage('Deve inidicar a password'),
    check('confirmPassword').custom((value, { req }) => {
            if(value !== req.body.password){
                throw new Error('As passwords deve ser iguais');
            }

            return true;
        })
], UsersController.createUser);

// EDITAR UTILIZADOR
router.get('/editarUtilizador/:id', UsersController.fetchUser);

router.put('/editarUtilizador/:id', [
    check('password').not().isEmpty().withMessage('Deve inidicar a password'),
    check('confirmPassword').custom((value, { req }) => {
            if(value !== req.body.password){
                throw new Error('As passwords deve ser iguais');
            }

            return true;
        })
], UsersController.updateUser);

// APAGAR UTILIZADOR
router.delete('/:id', UsersController.deleteUser);

module.exports = router;