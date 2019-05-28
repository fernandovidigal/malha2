const User = require('../../models/User');
const { validationResult } = require('express-validator/check');

exports.getAllUsers = function(req, res, next){
    User.findAll()
    .then(users => {
        res.render('admin/utilizadores', {users: users});
    })
    .catch(err => {
        req.flash('error', 'Ocurreu um erro ao registar o utilizador!');
        res.redirect('/admin/utilizadores');
    });
}

exports.createUser = function(req, res, next){
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // TODO: Handle Errors
    } else {
        User.createUser({
            username: req.body.username,
            password: req.body.password,
            level: req.body.level
        })
        .then(user => {
            req.flash('success', 'Utilizador Adicionado com sucesso');
            res.redirect('/admin/utilizadores');
        })
        .catch(err => {
            console.log(err);
            // TODO: check for unique error
        });
    }
}