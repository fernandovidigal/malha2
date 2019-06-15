const express = require('express');
const router = express.Router();
const { userAuthenticated, checkAdminStatus } = require('../../helpers/auth');
const { check } = require('express-validator/check');
const EscaloesController = require('../../controllers/admin/escaloes');

router.all('/*', [userAuthenticated, checkAdminStatus], (req, res, next) => {
    next();
});

router.get('/', EscaloesController.getAllEscaloes);

router.get('/adicionarEscalao', (req, res) => {
    res.render('admin/adicionarEscalao');
});


router.post('/adicionarEscalao', [
    check('designacao').trim().not().isEmpty().withMessage('Deve indicar a designação do escalão'),
    check('sexo').custom((value, { req }) => {
        if(value !== '0' && value !== '1'){
            throw new Error('Deve selecionar o género a que corresponde o escalão');
        }
    
        return true;
    })
], EscaloesController.createEscalao);

router.get('/editarEscalao/:id', EscaloesController.getEscalao);

router.put('/editarEscalao/:id', [
    check('designacao').trim().not().isEmpty().withMessage('Deve indicar a designação do escalão'),
    check('sexo').custom((value, { req }) => {
        if(value !== '0' && value !== '1'){
            throw new Error('Deve selecionar o género a que corresponde o escalão');
        }
    
        return true;
    })
], EscaloesController.updateEscalao);

router.delete('/deleteEscalao', EscaloesController.deleteEscalao);


module.exports = router;