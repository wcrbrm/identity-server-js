const networkConfig = {
  // USE THIS KIND OF MOCK SO FAR.
  // Closer to production, we will use 
  value: 'BTC', 
  name: 'Bitcoin', icon: '/networks/BTC.png',
  testnet: true, 
  local: 'http://localhost:18333'
};

// creation of new wallet. See BIP39 / BIP44 specs
// https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
// https://iancoleman.io/bip39/

// Original words:  [226, 113, 155, 241, 113, 142, 50, 251, 133, 242, 85, 0, 250, 83, 163, 160, 190, 251, 68, 241, 127, 42, 99, 229, 30, 27, 226, 21, 236, 180, 93, 158];
// Seed example: 'c72f78aa8c1d1037a1fa77409b29a5a1f32d4d962b2c0af96c48c098dff461daefed23f8339c3601649c7658827bae2e8c1054b0a26c88df8826db3eb9900030'

const create = ({ seed, index, networkConfig }) => {
  return {
	publicKey: '...',
	privateKey: '...'
  };
};

const walletPublicConfig = {
  networkConfig,
  publicKey: '1Z102012031203102301230120301'
};

const walletPrivateConfig = {
  networkConfig,
  publicKey: '1Z123123231231231231231231231',
  privateKey: '5127637612368128371782371239382a37389939330'
};


// In bitcoin blockchain we store just one type of asset: BTC
// (other blockchains are more advanced)
const getAssets = ({ walletPublicConfig }) => {
  // value should be a balance here:
  return [
    { name: 'BTC', value: '0.000000' }
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
  getPending
  getHistory,
  getTransactionDetails
};

