const express = require('express');
const router = express.Router();
const { userAuthenticated } = require('../../helpers/auth');
const { check } = require('express-validator/check');
const UsersController = require('../../controllers/admin/utilizadores');

router.all('/*', userAuthenticated, (req, res, next) => {
    next();
});

router.get('/', UsersController.getAllUsers);

// ADICIONAR UTILIZADOR
router.get('/adicionarUtilizador', (req, res) => {
    res.render('home/admin/adicionarUtilizador');
});

router.post('/adicionarUtilizador', [
    check('username', 'Deve indicar o nome de utilizador').isAlphanumeric().not().isEmpty(),
    check('password', 'Deve inidicar a password').not().isEmpty
], UsersController.createUser);

/*router.post('/adicionarUtilizador', (req, res) => {
    let erros = [];

    if(!req.body.username){
        erros.push({err_msg: 'Indique o username.'});
    }

    if(!req.body.password){
        erros.push({err_msg: 'Indique a password.'});
    }

    if(req.body.password !== req.body.verify_password){
        erros.push({err_msg: 'As passwords não são identicas.'});
    }

    let users = new UsersDB();

    // Existem erros
    if(erros.length > 0) {
        users.closeDB();
        let data = {
            username: req.body.username
        };
        res.render('home/admin/adicionarUtilizador', {utilizador: data, erros: erros});
    } else {
        users.addUser(
            req.body.username,
            req.body.password,
            req.body.status ? 1 : 0
        )
        .then(()=>{
            users.closeDB();
            req.flash('success', 'Utilizador Adicionado com sucesso');
            res.redirect('/admin/utilizadores');
        })
        .catch((err) => {
            users.closeDB();
            // Erro que aparece quando o username já existe na base de dados (UNIQUE)
            if(err.code = 'SQLITE_CONSTRAINT'){
                let data = {
                    username: req.body.username
                };
                let erros = [{
                    err_msg: 'Username já está em utilização.'
                }];
                res.render('home/admin/adicionarUtilizador', {utilizador: data, erros: erros});
            } else {
                req.flash('error', 'Ocurreu um erro ao registar o utilizador!');
                console.log(err);
                res.redirect('/admin/utilizadores');
            }
        });
    } 
});*/

// EDITAR UTILIZADOR
router.get('/editarUtilizador/:id', (req, res) => {
    let users = new UsersDB();
    users.getUserById(req.params.id)
    .then((utilizador) => {
        users.closeDB();
        res.render('home/admin/editarUtilizador', {utilizador: utilizador});
    })
    .catch((err) => {
        console.log(err);
        users.closeDB();
        req.flash('error', 'Não foi possível aceder aos dados do utilizador.');
        res.redirect('/admin/utilizadores');
    });
});

router.put('/editarUtilizador/:id', (req, res)=>{
    let erros = [];

    if(!req.body.username){
        erros.push({err_msg: 'Indique o username.'});
    }

    if(!req.body.password){
        erros.push({err_msg: 'Indique a password.'});
    }

    if(req.body.password !== req.body.verify_password){
        erros.push({err_msg: 'As passwords não são identicas.'});
    }

    const users = new UsersDB();
    // Existem erross
    if(erros.length > 0) {
        users.getUserById(req.params.id)
        .then((utilizadores) => {
            users.closeDB();
            utilizadores.username = req.body.username;
            utilizadores.status = req.body.status;
            res.render('home/admin/editarUtilizador', {utilizador: utilizadores, erros: erros});
        })
        .catch((err) => {
            console.log(err);
            users.closeDB();
            res.render('home/admin/editarUtilizador', {erros: erros});
        });
    } else {
        users.updateUser(
            req.params.id,
            req.body.username,
            req.body.password,
            req.body.status ? 1 : 0
        )
        .then(() => {
            users.closeDB();
            req.flash('success', 'Utilizador actualizado com sucesso');
            res.redirect('/admin/utilizadores');
        })
        .catch((err)=>{
            console.log(err);
            users.closeDB();
            req.flash('error', 'Não foi possível actualizar o utilizador!');
            res.redirect('/admin/utilizadores');
        });
    }
});

// APAGAR UTILIZADOR
router.delete('/:id', (req, res) => {
    const users = new UsersDB();
    users.deleteUser(req.params.id)
    .then(() => {
        users.closeDB();
        req.flash('success', `Utilizador eliminado com sucesso`)
        res.redirect('/admin/utilizadores');
    })
    .catch((err) => { 
        console.log(err);
        users.closeDB();
        req.flash('error', 'Não foi possível eliminar o utilizador.');
        res.redirect('/admin/utilizadores');
    });
});

module.exports = router;