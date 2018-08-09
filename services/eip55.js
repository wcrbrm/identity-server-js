const ethUtil = require('ethereumjs-util');

const toChecksumAddress = (address) => {
  address = ethUtil.stripHexPrefix(address).toLowerCase();
  const hash = ethUtil.sha3(address).toString('hex');
  let ret = '0x';
  for (let i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += address[i].toUpperCase();
    } else {
      ret += address[i];
    }
  }
  return ret;
};

module.exports = { toChecksumAddress };
