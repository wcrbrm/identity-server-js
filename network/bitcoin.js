const bitcoinJs = require('bitcoinjs-lib');
const bip32 = require('bip32');
const bip39 = require('bip39');
const coinConstants = require('bip44-constants');
const btc = require('./btcQuery');
const utils = require('./bitcoin.utils');

// creation of new wallet. See BIP39 / BIP44 specs
// https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
// https://iancoleman.io/bip39/

// Original words:  [226, 113, 155, 241, 113, 142, 50, 251, 133, 242, 85, 0, 250, 83, 163, 160, 190, 251, 68, 241, 127, 42, 99, 229, 30, 27, 226, 21, 236, 180, 93, 158];
// Seed example: 'c72f78aa8c1d1037a1fa77409b29a5a1f32d4d962b2c0af96c48c098dff461daefed23f8339c3601649c7658827bae2e8c1054b0a26c88df8826db3eb9900030'

const create = ({ seed, index, networkConfig }) => {
  // network?

  // Get bip32RootKey from seed:
  const bip32RootKey = bitcoinJs.HDNode.fromSeedHex(seed); //.toBase58();
  //console.log(bip32RootKey);
  
  // Get derivation path
  const purpose = 44;
  const coin = coinConstants[networkConfig.value] - bitcoinJs.HDNode.HIGHEST_BIT;
  const account = 0;
  const change = 0;

  let path = "m/";
  path += purpose + "'/";
  path += coin + "'/";
  path += account + "'/";
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
  var address = keyPair.getAddress().toString();
  // get privkey
  const privateKey = keyPair.toWIF();
  // get pubkey
  const publicKey = keyPair.getPublicKeyBuffer().toString('hex');

  return { publicKey, privateKey };
};



// In bitcoin blockchain we store just one type of asset: BTC
// (other blockchains are more advanced)
const getAssets = async ({ walletPublicConfig }) => {
  const address = utils.getAddressFromPubKey({ walletPublicConfig });
  const unspent = await btc.query({ 
    method: 'listunspent', 
    params: [0, 9999999, [address]], 
    config: walletPublicConfig.networkConfig
  });
  const balance = unspent.reduce((amount, tx) => amount + tx.amount, 0);
  // value should be a balance here:
  return { name: 'BTC', value: balance };
};

const sendTransaction = async ({ asset = 'BTC', amount, fee, to, change, walletPrivateConfig }) => {
  const { publicKey, networkConfig } = walletPrivateConfig;
  const walletPublicConfig = { publicKey, networkConfig };
  // List transaction of the address
  const from = utils.getAddressFromPubKey({ walletPublicConfig });
  const unspentTransactions = await btc.query({ 
    method: 'listunspent',
    params: [0, 9999999, [from]], 
    config: networkConfig
  });

  const transactionsToSpend = utils.getTxsToSpend({ unspentTransactions, amount });
  const txInputs = utils.generateTxInputs({ transactionsToSpend });
  const txOutputs = utils.generateTxOutputs({ transactionsToSpend, amount, fee, to, change });
  //console.log(transactionsToSpend, txInputs, txOutputs);  

  const rawTransaction = await btc.query({ method: 'createrawtransaction', params: [
    txInputs,
    txOutputs
  ], config: networkConfig });
  //console.log(rawTransaction);
  
  const signedTransaction = await btc.query({
    method: 'signrawtransaction',
    params: [ rawTransaction, null, [ walletPrivateConfig.privateKey ] ],
    config: networkConfig
  });
  //console.log(signedTransaction);

  const sentTransaction = await btc.query({ 
    method: 'sendrawtransaction',
    params: [signedTransaction.hex], 
    config: networkConfig 
  });
  //console.log(sentTransaction);

  // should return transaction hash if succeed. Or throw exception if not
  return sentTransaction; 
};

// get list of pending transactions
const getPending = ({ walletPublicConfig }) => {
  return [];
};

// get list of past transactions. could paging be better?
const getHistory = ({ walletPrivateConfig, start = 0, limit = 100 }) => {
  return [];
};

// get transaction details
const getTransactionDetails = ({ walletPublicConfig, txHash }) => {
  return {};
};


module.exports = {
  create,
  getAssets,
  sendTransaction,
  getPending,
  getHistory,
  getTransactionDetails
};

