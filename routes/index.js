const express = require('express');
const router = express.Router();
const {userAuthenticated, checkAdminStatus} = require('../helpers/auth');

router.all('/*', userAuthenticated, (req, res, next) => {
    next();
});

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/admin', (req, res) => {
    res.render('admin/index');
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

module.exports = router;