const Sequelize = require('sequelize');
const sequelize = require('../helpers/database');

const Localidade = sequelize.define('localidades', {
    localidadeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: {
            args: true,
            msg: "A localidade já existe."
        }
    },
    syncHash: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: {
            args: true,
            msg: "A localidade já existe."
        }
    },
    syncApp: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    syncWeb: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});

module.exports = Localidade;