const bitcoinJs = require('bitcoinjs-lib');
const bip32 = require('bip32');
const bip39 = require('bip39');
const coinConstants = require('bip44-constants');
const ElectrumClient = require('electrum-client');
const btc = require('./bitcoin-query');
const utils = require('./bitcoin-utils');
const base58 = require('./../../services/base58');

const create = ({ seed, index, networkConfig }) => {
  return require('./../../services/hdwallet').create({ seed, index, network: 'BTC' });
};

const isValidAddress = ({ address, networkConfig }) => {
  // WARNING: THIS IS DRAFT, TEST COVERAGE IS REQUIRED
  // sources: https://en.bitcoin.it/wiki/List_of_address_prefixes
  const firstChar = address.substring(0, 1);
  const hasNicePrefix = networkConfig.testnet ? 
    (firstChar === 'm' || firstChar === 'n' || firstChar === '2') : 
    (firstChar === '1' || firstChar === '3');
  const minExpectedLength = networkConfig.testnet ? 34 : 26;
  const maxExpectedLength = 34;
  const hasNiceSize = address.length <= maxExpectedLength && address.length >= minExpectedLength;
  const isValidChars = base58.check(address.substring(1));

  const valid = hasNicePrefix && hasNiceSize && isValidChars;
  return { valid };
}


// In bitcoin blockchain we store just one type of asset: BTC
// (other blockchains are more advanced)
// const getAssets = async ({ walletPublicConfig }) => {
//   const address = utils.getAddressFromPubKey({ walletPublicConfig });
//   const unspent = await btc.query({ 
//     method: 'listunspent', 
//     params: [0, 9999999, [address]], 
//     config: walletPublicConfig.networkConfig
//   });
//   const balance = unspent.reduce((amount, tx) => amount + tx.amount, 0);
//   // value should be a balance here:
//   return { name: 'BTC', value: balance };
// };

const getAssets = async ({ walletPublicConfig }) => {
  const address = utils.getAddressFromPubKey({ walletPublicConfig });
  const { host, port, protocol } = walletPublicConfig.networkConfig.electrum;
  const electrumClient = new ElectrumClient(port, host, protocol);
  await electrumClient.connect();
  const balance = await electrumClient.blockchainAddress_getBalance(address);
  const value = utils.parse(
                  utils.parseSatoshi(
                    balance 
                    && balance.confirmed !== undefined 
                    && balance.unconfirmed !== undefined 
                    ? balance.confirmed + balance.unconfirmed 
                    : 0
                  )
                );
  return { name: 'BTC', value };
};


// const sendTransaction = async ({ asset = 'BTC', amount, fee, to, change, walletPrivateConfig }) => {
//   const { publicKey, networkConfig } = walletPrivateConfig;
//   const walletPublicConfig = { publicKey, networkConfig };
//   // List transaction of the address
//   const from = utils.getAddressFromPubKey({ walletPublicConfig });
//   const unspentTransactions = await btc.query({ 
//     method: 'listunspent',
//     params: [0, 9999999, [from]], 
//     config: networkConfig
//   });
//   //console.log(unspentTransactions);

//   const transactionsToSpend = utils.getTxsToSpend({ unspentTransactions, amount: (amount + fee) });
//   const txInputs = utils.generateTxInputs({ transactionsToSpend });
//   const txOutputs = utils.generateTxOutputs({ transactionsToSpend, amount, fee, to, change });
//   //console.log(transactionsToSpend, txInputs, txOutputs);  

//   const rawTransaction = await btc.query({ method: 'createrawtransaction', params: [
//     txInputs,
//     txOutputs
//   ], config: networkConfig });
//   //console.log(rawTransaction);
  
//   const signedTransaction = await btc.query({
//     method: 'signrawtransaction',
//     params: [ rawTransaction, null, [ walletPrivateConfig.privateKey ] ],
//     config: networkConfig
//   });
//   //console.log(signedTransaction);

//   const sentTransaction = await btc.query({ 
//     method: 'sendrawtransaction',
//     params: [signedTransaction.hex], 
//     config: networkConfig 
//   });
//   //console.log(sentTransaction);

//   // should return transaction hash if succeed. Or throw exception if not
//   return sentTransaction; 
// };

const sendTransaction = async ({ asset = 'BTC', amount, fee, to, change, walletPrivateConfig }) => {
  const { privateKey, publicKey, networkConfig } = walletPrivateConfig;
  const walletPublicConfig = { publicKey, networkConfig };
  const { host, port, protocol } = networkConfig.electrum;
  const electrumClient = new ElectrumClient(port, host, protocol);
  const network = utils.getNetwork({ networkConfig });
  const builder = new bitcoinJs.TransactionBuilder(network);

  await electrumClient.connect(); 
  // List transaction of the address
  const from = utils.getAddressFromPubKey({ walletPublicConfig });
  const unspent = await electrumClient.blockchainAddress_listunspent(from);
  const toSpend = utils.getTxsToSpend2({ unspent, amount: (amount + fee) });
  
  toSpend.forEach((tx) => builder.addInput(tx.tx_hash, tx.tx_pos));

  const sum = toSpend.reduce((sum, tx) => sum + tx.value, 0); // satoshi
  builder.addOutput(to, utils.toSatoshi(amount));
  builder.addOutput(change, (sum - utils.toSatoshi(amount) - utils.toSatoshi(fee)));

  // Sign each transaction input
  toSpend.forEach((tx, i) => builder.sign(i, bitcoinJs.ECPair.fromWIF(privateKey, network)));
  
  const transaction = builder.build();
  const tx = transaction.toHex();

  const sentTx = await electrumClient.blockchainTransaction_broadcast(tx);

  // should return transaction hash if succeed. Or throw exception if not
  return sentTx; 
};

// get list of pending transactions
// const getPending = async ({ walletPublicConfig }) => {
//   // Get address from publicKey
//   const address = utils.getAddressFromPubKey({ walletPublicConfig });
//   // Query listunspent 0 0 address
//   const pendingUnspent = await btc.query({ 
//     method: 'listunspent', 
//     params: [0, 0, [address]], 
//     config: walletPublicConfig.networkConfig
//   });
  
//   return pendingUnspent || [];
// };

const getPending = async ({ walletPublicConfig }) => {
  // Get address from publicKey
  const address = utils.getAddressFromPubKey({ walletPublicConfig });
  const { host, port, protocol } = walletPublicConfig.networkConfig.electrum;
  const electrumClient = new ElectrumClient(port, host, protocol);
  await electrumClient.connect();
  const mempool = await electrumClient.blockchainAddress_getMempool(address);
  //console.log(mempool);

  if (mempool && mempool.length > 0) {
    const mempoolTransactions = mempool.map(async (m) => {
      const network = utils.getNetwork({ networkConfig: walletPublicConfig.networkConfig });
      // Transaction id:
      const txid = m.tx_hash;
      //console.log(txid);
      // Transaction data hash:
      const hex = await electrumClient.blockchainTransaction_get(txid);
      // Transaction as Buffer:
      const tx = bitcoinJs.Transaction.fromHex(hex);

      // Sender:
      // https://bitcoin.stackexchange.com/questions/28182/how-to-find-the-change-sender-address-given-a-txid
      // Process transaction inputs:
      const inputs = utils.decodeInput(tx);
      const sender = [];
      //console.log(inputs);
      inputs.forEach(async (input) => {
        const iTxid = input.txid;
        const iN = input.n;
        const iHex = await electrumClient.blockchainTransaction_get(iTxid);
        const iTx = bitcoinJs.Transaction.fromHex(iHex);
      
        const outputs = utils.decodeOutput(iTx, network);
        outputs.forEach(output => {
          if (output.n === iN) {
            sender.concat(output.scriptPubKey.addresses);
          }
        });
      });

      // Receiver:
      // Process transaction outputs
      const outputs = utils.decodeOutput(tx, network);
      const receiver = {};
      outputs.forEach(o => {
        const address = o.scriptPubKey.addresses[0];
        receiver[address] = o.value;
      });

      return {
        txid,
        sender,
        receiver
      };
    });
    return await Promise.all(mempoolTransactions);
  } else {
    return [];
  }
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

