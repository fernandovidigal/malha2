const express = require('express');
const router = express.Router();
const {userAuthenticated, checkAdminStatus} = require('../helpers/auth');
const indexController = require('../controllers/index');
const { check } = require('express-validator');

router.all('/*', userAuthenticated, (req, res, next) => {
    next();
});

router.get('/', (req, res) => {
    res.render('index', { breadcrumbs: req.breadcrumbs()});
});

router.get('/admin(/*)?', (req, res, next) => {
    res.locals.menuAdmin = true;
    req.breadcrumbs('Administração', '/admin');
    next();
});

router.post('/admin(/*)?', (req, res, next) => {
    res.locals.menuAdmin = true;
    req.breadcrumbs('Administração', '/admin');
    next();
});

router.put('/admin(/*)?', (req, res, next) => {
    res.locals.menuAdmin = true;
    req.breadcrumbs('Administração', '/admin');
    next();
});


router.get('/admin', (req, res) => {
    res.render('admin/index', { breadcrumbs: req.breadcrumbs()});
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

router.get('/alterarPassword/:userId', indexController.changeUserPassword);

router.put('/alterarPassword/:userId', [
    check('currentPassword').not().isEmpty().withMessage('Deve inidicar a password actual'),
    check('newPassword').not().isEmpty().withMessage('Deve inidicar a nova password'),
    check('confirmNewPassword').custom((value, { req }) => {
        if(value.trim() == ''){
            throw new Error('Deve confirmar a nova password');
        } else if(value.trim() !== req.body.newPassword.trim()){
            throw new Error('Deve ser igual à nova password');
        }

        return true;
    })
], indexController.saveUserPassword);

module.exports = router;