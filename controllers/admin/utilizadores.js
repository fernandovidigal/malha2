const User = require('../../models/User');
const { validationResult } = require('express-validator/check');
const util = require('../../helpers/util');

exports.getAllUsers = (req, res, next) => {
    User.findAll()
    .then(users => {
        res.render('admin/utilizadores', {users: users});
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Ocurreu um erro ao obter dados dos utilizadores!');
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
            if(user){
                res.render('admin/alterarPasswordUtilizador', {user: user});
            } else {
                req.flash('error', 'Utilizador inválido.');
                res.redirect('/admin/utilizadores');
            }
            
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Não foi possível aceder aos dados do utilizador.');
            res.redirect('/admin/utilizadores');
        });
}

exports.updateUserPassword = (req, res, next) => {
    const userId = req.params.id;
    const password = req.body.password;
    const errors = validationResult(req);

    User.findByPk(userId)
        .then(user => {
            if(!user){
                req.flash('error', 'Utilizador inexistente.');
                return res.redirect('/admin/utilizadores');
            }

            if (!errors.isEmpty()) {
                res.render('admin/alterarPasswordUtilizador', {validationErrors: errors.array(), user: user});
            } else {
                user.password = util.encrypt(password);
                user.save()
                .then(result => {
                    if(result){
                        req.flash('success', 'Password actualizada com sucesso.');
                        res.redirect('/admin/utilizadores');
                    } else {
                        req.flash('error', 'Ocurreu um erro durante a actualização da password do utilizador.');
                        res.redirect('/admin/utilizadores');
                    } 
                })
                .catch(err => {
                    req.flash('error', 'Não foi possível actualizar a password do utilizador.');
                    res.redirect('/admin/utilizadores');
                });
            }
            
        })
        .catch(err => {
            req.flash('error', 'Não foi possível actualizar a password do utilizador.');
            res.redirect('/admin/utilizadores');
        });
}

exports.changeUserLevel = (req, res, next) => {
    const userId = req.params.userid;
    const level = req.params.level;

    if(req.user.level == 10) {
        User.update(
            {level: level},
            {where: {userId: userId}}
        )
        .then(result => {
            req.flash('success', 'Nível de acesso do utilizador foi actualizado com sucesso.');
            res.redirect('/admin/utilizadores');
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Não foi possível alterar o nível de acesso do utilizador.');
            res.redirect('/admin/utilizadores');
        });
    } else {
        req.flash('error', 'Não tem permissão para alterar o nível de acesso dos utilizadores.');
        es.redirect('/admin/utilizadores');
    }
}

exports.deleteUser = (req, res, next) => {
    const userId = req.body.id;

    User.destroy({where: {userId: userId}, limit: 1})
        .then(result => {
            if(result){
                res.status(200).json({success: true});
            } else {
                res.status(200).json({success: false});
            }
        })
        .catch(err => { 
            res.status(200).json({success: false});
        });
}