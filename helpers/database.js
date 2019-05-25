const Sequelize = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './data/malha.sqlite',
    define: {
        timestamps: false
    }
});

module.exports = sequelize;