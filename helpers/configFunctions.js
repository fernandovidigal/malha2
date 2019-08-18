const fs = require('fs');
const path = require('path');
const appPaths = require('./appPaths');

exports.readConfigFile = async function(){
    return new Promise((resolve, reject) => {
        fs.readFile(appPaths.configFileName, 'utf8', (err, data) => {
            if(err) return reject(err);
            resolve(JSON.parse(data));
        });
    });
}

exports.writeConfigFile = async function(data){
    return new Promise((resolve, reject) => {
        const configData = JSON.stringify(data);
        fs.writeFile(appPaths.configFileName, configData, (err) => {
            if(err) return reject(err);
            resolve();
        });
    });
}