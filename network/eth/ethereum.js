const Web3 = require("web3");
const network = 'ETH';

const { getWeb3Client } = require('./ethereum-networkhelper')({ network });

const create = async ({ seed, index, networkConfig }) => {
  return require('./../../services/hdwallet')
    .create({ seed, index, network, hex: true });
};

const createRandom = async ({ networkConfig }) => {
  const web3 = getWeb3Client(networkConfig);
  const { privateKey, address } = web3.eth.accounts.create();
  if (!privateKey) throw new Error('Private Key was not generated for ETH');
  if (address.indexOf('0x') !== 0) throw new Error('Address should start with 0x');
  return { address, privateKey };
};


const getEth = ({ web3, address }) => {
  return new Promise((resolve, reject) => {
    web3.eth.getBalance(address, (error, response) => {
      if (error) reject(error);
      resolve(web3.fromWei(response.toNumber(), "ether"));
    });
  });
};

const getAssets = async ({ walletPublicConfig }) => {
  
  // 1) getting ETH balance here:
  const { address, networkConfig } = walletPublicConfig;
  const web3 = getWeb3Client(networkConfig);
  return [
    { name: 'ETH', value: await getEth({ web3, address }) }
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

