const Web3 = require("web3");

const create = async ({ seed, index, networkConfig }) => {
  return require('./../../services/hdwallet').create({ seed, index, network: 'ETH', hex: true });
};

const createRandom = async ({ networkConfig }) => {
  const web3 = new Web3('http://localhost:8545');
  const { privateKey, address } = web3.eth.accounts.create();
  if (!privateKey) throw new Error('Private Key was not generated for ETH');
  if (address.indexOf('0x') !== 0) throw new Error('Address should start with 0x');
  return { address, privateKey };
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

