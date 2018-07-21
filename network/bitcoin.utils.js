const bitcoinJs = require('bitcoinjs-lib');

const getNetwork = ({ networkConfig }) => {
  // Regtest is also a Testnet, no special config needed
  return networkConfig.testnet ? bitcoinJs.networks.testnet : bitcoinJs.networks.bitcoin;
};

const getAddressFromPubKey = ({ walletPublicConfig }) => {
  const { publicKey, networkConfig } = walletPublicConfig;
  const publicKeyBuffer = Buffer.from(publicKey, 'hex');
  return bitcoinJs.ECPair.fromPublicKeyBuffer(publicKeyBuffer, getNetwork({ networkConfig })).getAddress();
};

const getTxsToSpend = ({ unspentTransactions, amount }) => {
  let sum = 0;
  const transactionsToUse = unspentTransactions.sort((tx1, tx2) => (
    tx2.confirmations - tx1.confirmations
  )).filter(tx => {
    if (tx.vout === 0) {
      const oldSum = sum;
      sum += tx.amount;
      return oldSum <= amount;
    }
    return false;
  });
  return transactionsToUse;
};

const generateTxInputs = ({ transactionsToSpend }) => {
  const rawTxInputs = transactionsToSpend.map(tx => (
    {
      txid: tx.txid,
      vout: tx.vout
    }
  ));
  return rawTxInputs;
};

const generateTxOutputs = ({ transactionsToSpend, amount, fee, to, change }) => {
  const txsSum = transactionsToSpend.reduce((acc, tx) => acc + tx.amount, 0);
  const rawTxOutputs = {
    [to]: amount,
    [change]: txsSum - amount - fee
  };
  return rawTxOutputs;
};

module.exports = {
  getNetwork,
  getAddressFromPubKey,
  getTxsToSpend,
  generateTxInputs,
  generateTxOutputs
}
