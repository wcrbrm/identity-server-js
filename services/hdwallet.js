const bitcoinJs = require('bitcoinjs-lib');
// const bip32 = require('bip32');
const bip39 = require('bip39');
const coinConstants = require('bip44-constants');
const ethUtil = require('ethereumjs-util');
const { toChecksumAddress } = require('./eip55');

const rmUndefined = obj => (JSON.parse(JSON.stringify(obj)));

const create = ({ seed, index, network, hex = false, multiAddress = false }) => {
  // network?

  // Get bip32RootKey from seed:
  const bip32RootKey = bitcoinJs.HDNode.fromSeedHex(seed); //.toBase58();
  //console.log(bip32RootKey);
 
  if (!coinConstants[network]) throw new Error('Coin Type cannout be defined from network ' + network);

  // Get derivation path
  // m / purpose' / coin_type' / account' / change / address_index
  const purpose = 44;
  const coin = coinConstants[network] - bitcoinJs.HDNode.HIGHEST_BIT;
  const account = 0;
  const change = 0;

  let path = "m/";
  path += purpose + "'/";
  path += coin + "'/";
  path += account + "'/";
  path += change;
  
  // Get bip32ExtendedKey (derive from path)
  let bip32ExtendedKey = bip32RootKey;
  const pathBits = path.split("/");
  for (let i = 0; i < pathBits.length; i++) {
    const bit = pathBits[i];
    const index = parseInt(bit);
    if (isNaN(index)) {
        continue;
    }
    const hardened = bit[bit.length-1] == "'";
    const isPriv = !(bip32ExtendedKey.isNeutered());
    const invalidDerivationPath = hardened && !isPriv;
    if (invalidDerivationPath) {
        bip32ExtendedKey = null;
    } else if (hardened) {
        bip32ExtendedKey = bip32ExtendedKey.deriveHardened(index);
    } else {
        bip32ExtendedKey = bip32ExtendedKey.derive(index);
    }
  }

  // Get private and public key for a certain index 
  const key = bip32ExtendedKey.derive(index);
  const keyPair = key.keyPair;
  // get address
  const address = multiAddress ? undefined : keyPair.getAddress().toString();
  // get privkey
  const privateKey = keyPair.toWIF();
  // get pubkey
  const publicKey = keyPair.getPublicKeyBuffer().toString('hex');

  if (hex) {
    // multiaddress is not an option for blockchains with HEX address representation
    const privKeyBuffer = keyPair.d.toBuffer(32);
    const privkey = privKeyBuffer.toString('hex');
    const addressBuffer = ethUtil.privateToAddress(privKeyBuffer);
    const hexAddress = addressBuffer.toString('hex');
    const checksumAddress = toChecksumAddress(hexAddress);
    return {
       path,
       address: ethUtil.addHexPrefix(checksumAddress),
       privateKey: ethUtil.addHexPrefix(privkey),
       publicKey: ethUtil.addHexPrefix(publicKey)
    };
  }

  path += '/' + index;
  return rmUndefined({ path, address, publicKey, privateKey });
};

module.exports = {
  create
};