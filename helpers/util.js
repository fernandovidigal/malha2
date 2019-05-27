const bcrypt = require('bcryptjs');

module.exports.encrypt = function(word){
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(word, salt);
}