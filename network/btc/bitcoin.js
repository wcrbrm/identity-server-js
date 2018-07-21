const bitcoinJs = require('bitcoinjs-lib');
const bip32 = require('bip32');
const bip39 = require('bip39');
const coinConstants = require('bip44-constants');
const btc = require('./bitcoin-query');
const utils = require('./bitcoin-utils');

const create = ({ seed, index, networkConfig }) => {
  // TODO: selecting network correctly
  return require('./../../services/hdwallet').create({ seed, index, network: 'BTC' });
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

const sendTransaction = ({ asset = 'BTC', amount, to, walletPrivateConfig }) => {
  return '0x000000000000000000000000000000000000'; 
  // should return transaction hash if succeed. Or throw exception if not
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

