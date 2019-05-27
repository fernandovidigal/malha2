const Sequelize = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './data/malha.db',
    logging: false,
    define: {
        timestamps: false
    }
});

module.exports = sequelize;