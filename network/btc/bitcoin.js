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
  //console.log(unspentTransactions);

  const transactionsToSpend = utils.getTxsToSpend({ unspentTransactions, amount: (amount + fee) });
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
const getPending = async ({ walletPublicConfig }) => {
  // Get address from publicKey
  const address = utils.getAddressFromPubKey({ walletPublicConfig });
  // Query listunspent 0 0 address
  const pendingUnspent = await btc.query({ 
    method: 'listunspent', 
    params: [0, 0, [address]], 
    config: walletPublicConfig.networkConfig
  });
  
  return pendingUnspent || [];
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

