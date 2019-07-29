const fs = require('fs');
const path = require('path');

module.exports.dataDirectoryCheck = function(){
    const dataDirName = 'data';
    //const dataDirName = path.join(path.dirname(process.execPath), '/data');
    
    if(!fs.existsSync(dataDirName)){
        fs.mkdirSync(dataDirName);
    }
}