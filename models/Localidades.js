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
    syncApp: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: {
            args: true,
            msg: "A localidade já existe."
        }
    },
    syncWeb: {
        type: Sequelize.STRING(128),
        allowNull: true,
        defaultValue: null
    }
});

module.exports = Localidade;