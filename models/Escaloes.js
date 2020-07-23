const Sequelize = require('sequelize');
const sequelize = require('../helpers/database');

const Escaloes = sequelize.define('escaloes', {
    escalaoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    designacao: {
        type: Sequelize.STRING,
        allowNull: false
    },
    sexo: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
            msg: "O Escalão já existe."
        }
    },
    syncWeb: {
        type: Sequelize.STRING(128),
        allowNull: true,
        defaultValue: null
    }
}, {
    name: {
        singular: "escalao",
        plural: "escaloes"
    }
});

module.exports = Escaloes;