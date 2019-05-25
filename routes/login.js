const express = require('express');
const router = express.Router();

// ROUTES
router.all('/*', (req, res, next) => {
    req.app.locals.layout = 'login';
    next();
});

router.get('/', (req, res) => {
    res.render('login');
});

router.post('/', (req,res,next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: "Username ou password inválidos"
    })(req, res, next);
});

module.exports = router;