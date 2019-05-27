const fs = require('fs');
const path = require('path');

module.exports.dataDirectoryCheck = function(){
    const dataDirName = 'data';

    if(!fs.existsSync(dataDirName)){
        fs.mkdirSync(dataDirName);
    }
}