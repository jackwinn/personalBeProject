const crypto = require('crypto');

const cryptoProtocol = {

    sha256Hex: (plainText) => {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256').update(plainText).digest('hex');
            resolve(hash);
        });
    }
    
};

module.exports = cryptoProtocol;