const Sequelize = require('sequelize');
const sequelize = require('../helpers/database');

const SyncMessages = sequelize.define('syncmessages', {
    syncId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    status: {
        type: Sequelize.STRING(10),
        allowNull: false
    },
    uuid: {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null
    },
    dataset: {
        type: Sequelize.STRING(255),
        allowNull: false,
    },
    columnvalue: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null
    },
    fieldhash: {
        type: Sequelize.STRING(128),
        allowNull: true,
        defaultValue: null
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: false,
            fields: ['dataset', 'columnvalue']
        }
    ]
});

module.exports = SyncMessages;