const express = require('express');
const router = express.Router();
const {userAuthenticated, checkAdminStatus} = require('../helpers/auth');

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

/*router.get('/alterarPassword/:userId', (req, res) => {
    req.breadcrumbs('Alterar Password', '');
    res.render('alterarPassword', { breadcrumbs: req.breadcrumbs()});
});*/

module.exports = router;