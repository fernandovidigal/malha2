const Sequelize = require('sequelize');
const path = require('path');

//path.join(path.dirname(process.execPath), '/data/malha.db'),
const dbPath = "data/malha.db";
//const dbPath = path.join(path.dirname(process.execPath), '/data/malha.db');
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
    define: {
        timestamps: false
    }
});

module.exports = sequelize;