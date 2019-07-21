const express = require('express');
const router = express.Router();
const { userAuthenticated, checkGestorStatus } = require('../../helpers/auth');
const { check} = require('express-validator/check');
const TorneiosController = require('../../controllers/admin/torneios');

router.all('/*', [userAuthenticated, checkGestorStatus], (req, res, next) => {
    next();
});

router.get('/', TorneiosController.getAllTorneios);

router.get('/adicionarTorneio', TorneiosController.adicionarTorneio);

router.post('/adicionarTorneio', [
    check('designacao').not().isEmpty().withMessage('Deve indicar a designação do torneio.'),
    check('localidade').not().isEmpty().withMessage('Deve indicar a localidade do torneio.'),
    check('localidade').matches(/^[^0-9]+$/).withMessage('Nome da localidade inválido'),
    check('ano').not().isEmpty().withMessage('Deve indicar o ano do torneio.'),
    check('ano').matches(/^[0-9]{4}$/).withMessage('Ano do torneio inválido'),
    check('numCampos').custom((value, {req}) => {
        req.body.numCampos.forEach(campo => {
            if(campo != '' && campo != 0){
                if(Math.log2(parseInt(campo)) % 1 !== 0){
                    throw new Error("Número de campos inválido. O número de campos deve ser uma potência de 2. (Ex: 2, 4, 8, 16, ...)");
                }
            }
        });
        return true;
    }),
], TorneiosController.createTorneio);

router.get('/activaTorneio/:id', TorneiosController.ActivaTorneio);

router.get('/editarTorneio/:id', TorneiosController.getTorneio);

router.put('/editarTorneio/:id', [
    check('designacao').not().isEmpty().withMessage('Deve indicar a designação do torneio.'),
    check('localidade').not().isEmpty().withMessage('Deve indicar a localidade do torneio.'),
    check('localidade').matches(/^[^0-9]+$/).withMessage('Nome da localidade inválido'),
    check('ano').not().isEmpty().withMessage('Deve indicar o ano do torneio.'),
    check('ano').matches(/^[0-9]{4}$/).withMessage('Ano do torneio inválido'),
    check('numCampos').custom((value, {req}) => {
        req.body.numCampos.forEach(campo => {
            if(campo != '' && campo != 0){
                if(Math.log2(parseInt(campo)) % 1 !== 0){
                    throw new Error("Número de campos inválido. O número de campos deve ser uma potência de 2. (Ex: 2, 4, 8, 16, ...)");
                }
            }
        });

        return true;
    })
] ,TorneiosController.updateTorneio);

router.delete('/deleteTorneio', TorneiosController.deleteTorneio);

module.exports = router;