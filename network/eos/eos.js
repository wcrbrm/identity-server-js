const Eos = require("eosjs");

const create = async ({ seed, index, networkConfig }) => {

  const privateKey = await Eos.modules.ecc.randomKey();
  if (!privateKey) throw new Error('Private Key was not generated for EOS');
  const publicKey = Eos.modules.ecc.privateToPublic(privateKey);
  if (!publicKey) throw new Error('Public Key was not generated for EOS');
  if (publicKey.indexOf('EOS') !== 0) throw new Error('Public Key should start with EOS');
  return { publicKey, privateKey };
};

// In bitcoin blockchain we store just one type of asset: BTC
// (other blockchains are more advanced)
const getAssets = ({ walletPublicConfig }) => {
  // const publicKey = Buffer.from(walletPublicConfig.publicKey, 'hex');
  // const publicKeyHash = bitcoinJs.crypto.hash160(publicKey);

  // TODO: address generation: can use not only production (bitcoinJs.networks.bitcoin) network!
  // const address = bitcoinJs.address.toBase58Check(publicKeyHash, bitcoinJs.networks.bitcoin.pubKeyHash);
  // console.log(address);

  // value should be a balance here:
  return [
    { name: 'EOS', value: '0.000000' }
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



module.exports = {
  create,
  getAssets,
  sendTransaction,
  getPending,
  getHistory,
  getTransactionDetails
};

