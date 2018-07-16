
const mockEmptyStorage = {
  format: "hd", 
  seed: "000000000",
  pinCode: "0000",
  wallets: []
};
const modStorage = require('./storage');
modStorage.getStorageJson = () => (mockEmptyStorage);
modStorage.saveStorageJson = (options, json) => (false);

module.exports = modStorage;