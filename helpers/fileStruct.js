const fs = require('fs');
const path = require('path');
const appPaths = require('./appPaths');

module.exports.dataDirectoryCheck = function(){    
    if(!fs.existsSync(appPaths.dataDirName)){
        fs.mkdirSync(appPaths.dataDirName);
    }
}