
const mockEmptyStorage = {
  format: "hd",
  // dial draft lucky sort evoke awkward debris capable round anchor ride van glow enable decorate collect fade deliver outside dawn energy suffer sting amount
  seed: '5fc881701ccf149c83590921123d4ec665e6f602e19e6cf24d1caaead9562eb0d80a5cd51db8330abc15041bc3ca503b9c321f670546f8cb8a9b87e1ef44e2a0',
  // seed: "91a91def2b40913631d34db643f339ea871f2eb2529d54cde7ab8b051b3ea7c5d96f7b8e057660e23808115b63df3b063012b279c6326a65152ab8cc28e6f765",
  pinCode: "0000",
  wallets: []
};
const modStorage = require('./storage');
modStorage.getStorageJson = () => (mockEmptyStorage);
modStorage.saveStorageJson = (options, json) => (false);

module.exports = modStorage;
