const Sequelize = require('sequelize');
const sequelize = require('../helpers/database');

const SyncTime = sequelize.define('synctimes', {
    synctimeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    enviado: {
        type: Sequelize.DATE,
        allowNull: false
    },
    recebido: {
        type: Sequelize.DATE,
        allowNull: false
    }
});

module.exports = SyncTime;