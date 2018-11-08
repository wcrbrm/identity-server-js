const CryptoJS = require('crypto-js');

// Even if passphrase is not provided, message will be encoded with md5 of empty string
const encrypt = ({ message, passphrase = '' }) => {
  try {
    if (typeof message !== 'string') {
      message = JSON.stringify(message, null, 2);
    }
    const key = CryptoJS.MD5(passphrase).toString(); // need 32 chars
    const branca = require('branca')(key);

    return branca.encode(message);
  } catch (error) {
    throw new Error(error.message);
  }
};

const decrypt = ({ token, passphrase = '' }) => {
  try {
    const key = CryptoJS.MD5(passphrase).toString();
    const branca = require('branca')(key);
    return branca.decode(token).toString();
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  encrypt,
  decrypt
};