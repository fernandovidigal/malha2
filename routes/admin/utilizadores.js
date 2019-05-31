const express = require('express');
const router = express.Router();
const { userAuthenticated, checkAdminStatus } = require('../../helpers/auth');
const { check } = require('express-validator/check');
const UsersController = require('../../controllers/admin/utilizadores');

router.all('/*', [userAuthenticated, checkAdminStatus], (req, res, next) => {
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
router.get('/alterarPasswordUtilizador/:id', UsersController.fetchUser);

router.put('/alterarPasswordUtilizador/:id', [
    check('password').not().isEmpty().withMessage('Deve inidicar a password'),
    check('confirmPassword').custom((value, { req }) => {
            if(value !== req.body.password){
                throw new Error('As passwords deve ser iguais');
            }

            return true;
        })
], UsersController.updateUserPassword);

// APAGAR UTILIZADOR
router.delete('/deleteUser', UsersController.deleteUser);

// ALTERAR LEVEL
router.get('/changeLevel/:userid/level/:level', UsersController.changeUserLevel);

module.exports = router;