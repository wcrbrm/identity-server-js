const bitcoinJs = require('bitcoinjs-lib');
// const bip32 = require('bip32');
const bip39 = require('bip39');
const coinConstants = require('bip44-constants');
const ethUtil = require('ethereumjs-util');
const { toChecksumAddress } = require('./eip55');

const create = ({ seed, index, network, hex = false }) => {
  // network?

  // Get bip32RootKey from seed:
  const bip32RootKey = bitcoinJs.HDNode.fromSeedHex(seed); //.toBase58();
  //console.log(bip32RootKey);
  
  // Get derivation path
  const purpose = 44;
  const coin = coinConstants[network] - bitcoinJs.HDNode.HIGHEST_BIT;
  const change = 0;

  let path = "m/";
  path += purpose + "'/";
  path += coin + "'/";
  path += index + "'/";
  path += change;
  //console.log(path);
  
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
    }
    else if (hardened) {
        bip32ExtendedKey = bip32ExtendedKey.deriveHardened(index);
    }
    else {
        bip32ExtendedKey = bip32ExtendedKey.derive(index);
    }
  }
  //console.log(bip32ExtendedPrivKey.toBase58());

  // Get private and public key for a certain index 
  const key = bip32ExtendedKey.derive(index);
  const keyPair = key.keyPair;
  // get address
  const address = keyPair.getAddress().toString();
  // get privkey
  const privateKey = keyPair.toWIF();
  // get pubkey
  const publicKey = keyPair.getPublicKeyBuffer().toString('hex');

  if (hex) {
    const privKeyBuffer = keyPair.d.toBuffer(32);
    const privkey = privKeyBuffer.toString('hex');
    const addressBuffer = ethUtil.privateToAddress(privKeyBuffer);
    const hexAddress = addressBuffer.toString('hex');
    const checksumAddress = toChecksumAddress(hexAddress);
    return {
       address: ethUtil.addHexPrefix(checksumAddress),
       privateKey: ethUtil.addHexPrefix(privkey),
       publicKey: ethUtil.addHexPrefix(publicKey)
    };
  }

  return { address, publicKey, privateKey };
};

module.exports = {
  create
};