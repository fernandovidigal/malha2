const express = require('express');
const router = express.Router();
const {userAuthenticated, checkAdminStatus} = require('../../helpers/authentication');

router.all('/*', userAuthenticated, (req, res, next) => {
    req.app.locals.layout = 'home';
    next();
});

router.all('/admin(/*)?', checkAdminStatus, (req, res, next) => {
    next();
});

router.get('/', (req, res) => {
    res.render('home/index');
});

router.get('/admin', (req, res) => {
    res.render('home/admin/index');
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

module.exports = router;