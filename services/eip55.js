const ethUtil = require('ethereumjs-util');

const toChecksumAddress = function (address) {
  address = ethUtil.stripHexPrefix(address).toLowerCase()
  var hash = ethUtil.sha3(address).toString('hex')
  var ret = '0x';
  for (var i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += address[i].toUpperCase()
    } else {
      ret += address[i]
    }
  }
  return ret
};

module.exports = { toChecksumAddress };