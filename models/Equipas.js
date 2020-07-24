const Sequelize = require('sequelize');
const sequelize = require('../helpers/database');

const Equipas = sequelize.define('equipas', {
    equipaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    torneioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
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
        allowNull: false,
        primaryKey: true
    },
    escalaoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    syncApp: {
        type: Sequelize.STRING(128),
        allowNull: false
    },
    syncWeb: {
        type: Sequelize.STRING(128),
        allowNull: true,
        defaultValue: null
    }
},
{
    indexes: [
        {
            unique: true,
            fields: ['torneioId', 'syncApp']
        },
        {
            unique: true,
            fields: ['equipaId', 'torneioId', 'localidadeId', 'escalaoId']
        }
    ]
});

module.exports = Equipas;