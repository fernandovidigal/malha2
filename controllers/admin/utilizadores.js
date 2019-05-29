const User = require('../../models/User');
const { validationResult } = require('express-validator/check');
const util = require('../../helpers/util');

exports.getAllUsers = (req, res, next) => {
    User.findAll()
    .then(users => {
        res.render('admin/utilizadores', {users: users});
    })
    .catch(err => {
        req.flash('error', 'Ocurreu um erro ao registar o utilizador!');
        res.redirect('/admin/utilizadores');
    });
}

exports.createUser = (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;
    const level = req.body.level;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const oldData = {
            username: username,
            level: level
        }
        res.render('admin/adicionarUtilizador', {validationErrors: errors.array(), oldData: oldData});
    } else {
        User.findOne({where: {username: username}})
            .then( user => {
                if(user){
                    req.flash('error', 'Nome de utilizador já existe, por favor escolha outro');
                    res.redirect('/admin/utilizadores/adicionarUtilizador');
                } else {
                    User.create({
                        username: username,
                        password: util.encrypt(password),
                        level: level
                    })
                    .then(user => {
                        req.flash('success', 'Utilizador Adicionado com sucesso');
                        res.redirect('/admin/utilizadores');
                    })
                    .catch(err => {
                        console.log(err);
                        req.flash('error', 'Não foi possível registar o utilizador');
                        res.redirect('/admin/utilizadores');
                    });
                }
            });
    }
}

exports.fetchUser = (req, res, next) => {
    const userId = req.params.id;

    User.findByPk(userId)
        .then( user => {
            res.render('admin/editarUtilizador', {user: user});
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Não foi possível aceder aos dados do utilizador.');
            res.redirect('/admin/utilizadores');
        });
}

exports.updateUser = (req, res, next) => {
    const userId = req.params.id;
    const username = req.body.username;
    const password = req.body.password;
    const level = req.body.level;
    const errors = validationResult(req);

    console.log(req.body);

    if (!errors.isEmpty()) {
        const oldData = {
            userId: userId,
            username: username,
            level: level
        }
        res.render('admin/editarUtilizador', {validationErrors: errors.array(), user: oldData});
    } else {
        User.findByPk(userId)
            .then( user => {
                if (user.userId.toString() !== userId.toString()) {
                    req.flash('error', 'Não foi possível actualizar o utilizador');
                    return res.redirect('/admin/utilizadores');
                }

                user.password = util.encrypt(password);
                user.level = level;

                user.save()
                .then(result => {
                    req.flash('success', 'Utilizador actualizado com sucesso');
                    res.redirect('/admin/utilizadores');
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error', 'Não foi possível actualizar o utilizador!');
                    res.redirect('/admin/utilizadores');
                });
            })
            .catch(err => {
                console.log(err);
                req.flash('error', 'Não foi possível actualizar o utilizador.');
                res.redirect('/admin/utilizadores');
            });
    }
}

exports.deleteUser = (req, res, next) => {
    const userId = req.params.id;
    User.destroy({where: {userId: userId}})
        .then(result => {
            if(result){
                req.flash('success', `Utilizador eliminado com sucesso`)
                res.redirect('/admin/utilizadores');
            } else {
                req.flash('error', 'Não foi possível eliminar o utilizador.');
                es.redirect('/admin/utilizadores');
            }
        })
        .catch(err => { 
            console.log(err);
            req.flash('error', 'Não foi possível eliminar o utilizador.');
            res.redirect('/admin/utilizadores');
        });
}