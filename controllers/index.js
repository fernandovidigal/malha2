const User = require('../models/User');
const util = require('../helpers/util');
const { validationResult } = require('express-validator/check');

exports.changeUserPassword = (req, res, next) => {
    const userId = parseInt(req.params.userId);
    const loggedUserId = req.user.userId;

    if(userId === loggedUserId){
        const user = {
            userId: req.user.userId,
            username: req.user.username
        }
        req.breadcrumbs('Alterar Password', '');
        res.render('alterarPassword', { user: user, breadcrumbs: req.breadcrumbs()});
    } else {
        req.flash('error', 'Utilizador inválido');
        req.redirect('/');
    }
}

exports.saveUserPassword = async (req, res, next) => {
    const userId = parseInt(req.params.userId);
    const loggedUserId = req.user.userId;
    const password = req.body.password;
    const errors = validationResult(req);

    if(userId === loggedUserId){
        const user = await User.findByPk(loggedUserId);
        if(user){
            if (!errors.isEmpty()) {
                req.breadcrumbs('Alterar Password', '');
                res.render('alterarPassword', {validationErrors: errors.array(), user: user, breadcrumbs: req.breadcrumbs()});
            } else {
                user.password = util.encrypt(password);
                user.save()
                .then(result => {
                    if(result){
                        req.flash('success', 'Password actualizada com sucesso.');
                        res.redirect('/');
                    } else {
                        req.flash('error', 'Ocurreu um erro durante a actualização da password do utilizador.');
                        res.redirect('/');
                    } 
                })
                .catch(err => {
                    req.flash('error', 'Não foi possível actualizar a password do utilizador.');
                    res.redirect('/');
                });
            }
        } else {
            req.flash('error', 'Utilizador inexistente.');
            res.redirect('/');
        }
    } else {
        req.flash('error', 'Utilizador inválido');
        req.redirect('/');
    }
}