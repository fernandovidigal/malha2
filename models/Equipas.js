const Sequelize = require('sequelize');
const sequelize = require('../helpers/database');

const Equipas = sequelize.define('equipas', {
    equipaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    torneioId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    primeiroElemento: {
        type: Sequelize.STRING,
        allowNull: false
    },
    segundoElemento: {
        type: Sequelize.STRING,
        allowNull: false
    },
    localidadeId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    escalaoID: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

module.exports = Equipas;