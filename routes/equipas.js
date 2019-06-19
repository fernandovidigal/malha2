const express = require('express');
const router = express.Router();
const { userAuthenticated } = require('../helpers/auth');
const { check } = require('express-validator/check');
const EquipasController = require('../controllers/equipas');

router.all('/*', userAuthenticated, (req, res, next) => {
    next();
});

router.get('/', EquipasController.getAllEquipas);

module.exports = router;