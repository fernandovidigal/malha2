const fs = require('fs');
const path = require('path');
const configFileName = 'config.json';
//const configFileName = path.join(path.dirname(process.execPath), '/config.json');

exports.readConfigFile = async function(){
    return new Promise((resolve, reject) => {
        fs.readFile(configFileName, 'utf8', (err, data) => {
            if(err) return reject(err);
            resolve(JSON.parse(data));
        });
    });
}

exports.writeConfigFile = async function(data){
    return new Promise((resolve, reject) => {
        const configData = JSON.stringify(data);
        fs.writeFile(configFileName, configData, (err) => {
            if(err) return reject(err);
            resolve();
        });
    });
}