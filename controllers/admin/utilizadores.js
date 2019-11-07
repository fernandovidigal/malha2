const User = require('../../models/User');
const { validationResult } = require('express-validator/check');
const util = require('../../helpers/util');

exports.getAllUsers = (req, res, next) => {
    User.findAll()
    .then(users => {
        res.render('admin/utilizadores', {users: users, breadcrumbs: req.breadcrumbs()});
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Ocurreu um erro ao obter dados dos utilizadores!');
        res.redirect('/admin/utilizadores');
    });
}

exports.getUser = (req, res, next) => {
    const userId = req.params.id;

    User.findByPk(userId)
        .then( user => {
            if(user){
                req.breadcrumbs('Alterar Password', '/admin/alterarPasswordUtilizador');
                res.render('admin/alterarPasswordUtilizador', {user: user, breadcrumbs: req.breadcrumbs()});
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

exports.createUser = (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;
    const level = req.body.level;
    const errors = validationResult(req);

    const oldData = {
        username: username,
        level: level
    }

    if (!errors.isEmpty()) {
        req.breadcrumbs('Adicionar Utilizador', '/admin/adicionarUtilizador');
        res.render('admin/adicionarUtilizador', {validationErrors: errors.array({ onlyFirstError: true }), utilizador: oldData, breadcrumbs: req.breadcrumbs()});
    } else {
        User.findOrCreate({
            where: { username: username },
            defaults: {
                password: util.encrypt(password),
                level: level
            }
        })
        .then(([user, created]) => {
            if(created){
                req.flash('success', 'Utilizador adicionado com sucesso');
                res.redirect('/admin/utilizadores');
            } else {
                const errors = [{
                    msg: 'Nome de utilizador já está a ser utilizado',
                    param: 'username'
                }]
                res.render('admin/adicionarUtilizador', {validationErrors: errors, utilizador: oldData, breadcrumbs: req.breadcrumbs()});
            }
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Não foi possível registar o utilizador');
            res.redirect('/admin/utilizadores');
        });
    }
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
                req.breadcrumbs('Alterar Password', '/admin/alterarPasswordUtilizador');
                res.render('admin/alterarPasswordUtilizador', {validationErrors: errors.array(), user: user, breadcrumbs: req.breadcrumbs()});
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
    const userId = req.params.userId;
    const level = req.params.level;

    if(req.user.level == 10) {
        User.update(
            {level: level},
            {where: {userId: userId}}
        )
        .then(result => {
            req.flash('success', 'Nível de acesso do utilizador foi actualizado com sucesso');
            res.redirect('/admin/utilizadores');
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Não foi possível alterar o nível de acesso do utilizador');
            res.redirect('/admin/utilizadores');
        });
    } else {
        req.flash('error', 'Não tem permissão para alterar o nível de acesso dos utilizadores');
        es.redirect('/admin/utilizadores');
    }
}

exports.deleteUser = async (req, res, next) => {
    const userId = req.body.id;

    try{
        const user = await User.findByPk(userId);

        if(!user) throw new Error();

        if(user.level == 10){
            const numAdmins = await User.count({ 
                where: { level: 10 }
            });

            if(numAdmins == 1){
                return res.status(204).json({ success: false });
            }
        }

        await user.destroy();
        res.status(200).json({success: true});

    } catch(err){
        res.status(200).json({success: false});
    }
}