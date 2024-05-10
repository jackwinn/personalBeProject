const bcrypt = require('bcrypt');

const saltRounds = 10;

const bcryptAPI = {

    hashPassword: (plainText) => {
        return new Promise((resolve, reject) => {
            bcrypt.hash(plainText, saltRounds, (err, encrypted) => {
                if (err) reject(err);
                resolve(encrypted);
            });
        });
    },

    isMatchPasswordHash: (plainText, encrypted) => {
        return new Promise((resolve, reject) => {
            bcrypt.compare(plainText, encrypted, (err, same) => {
                if (err) reject(err);
                resolve(same);
            });
        });
    }

};

module.exports = bcryptAPI;