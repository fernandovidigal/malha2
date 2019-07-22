const express = require('express');
const router = express.Router();
const { userAuthenticated } = require('../helpers/auth');
const { check } = require('express-validator/check');
const ListagensController = require('../controllers/listagens');

router.all('/*', userAuthenticated, (req, res, next) => {
    next();
});

router.get('/', ListagensController.mostraListagens);

module.exports = router;