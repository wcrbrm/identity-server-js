module.exports = ({ network = 'EOS', prefix = 'EOS' }) => {

  const Eos = require("eosjs");

  const create = async ({ seed, index, networkConfig }) => {
    return require('./../../services/hdwallet').create({ 
      ...networkConfig, seed, index, network, prefix
    });
  };

  const isValidAddress = ({ address, networkConfig }) => {
    const hasNicePrefix = address.substring(0, prefix.length) === prefix;
    const valid = hasNicePrefix;
    return { valid };
  };

  const createRandom = async () => {
    const privateKey = await Eos.modules.ecc.randomKey();
    if (!privateKey) throw new Error('Private Key was not generated for ' + network);
    const publicKey = Eos.modules.ecc.privateToPublic(privateKey);
    if (!publicKey) throw new Error('Public Key was not generated for ' + network);
    if (publicKey.indexOf(prefix) !== 0) throw new Error('Public Key should start with ' + network);
    return { publicKey, privateKey };
  };

  const getAssets = ({ walletPublicConfig }) => {
    return [
      { name: network, value: '0.000000' }
    ];
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

  return {
    create,
    createRandom,
    isValidAddress,
    getAssets,
    sendTransaction,
    getPending,
    getHistory,
    getTransactionDetails
  };

};
