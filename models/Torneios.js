const Sequelize = require('sequelize');
const sequelize = require('../helpers/database');

const Torneios = sequelize.define('torneios', {
    torneioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    designacao: {
        type: Sequelize.STRING,
        allowNull: false
    },
    localidade: {
        type: Sequelize.STRING,
        allowNull: false
    },
    ano: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    activo: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 1
        }
    },
    syncApp: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: {
            args: true,
            msg: "O Torneio já existe."
        }
    },
    syncWeb: {
        type: Sequelize.STRING(128),
        allowNull: true,
        defaultValue: null
    }
});

module.exports = Torneios;