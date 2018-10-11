const { error } = require("./express-util")('wallet-info');
const sha1 = require('js-sha1');
const fs = require('fs');
const path = require('path');

function WalletInfo(walletInfo) {
  this.json = walletInfo;
  this.res = undefined;

  this.responseStream = function(res) {
    this.res = res;
    return this;
  };

  this.getNetworkModule = function(networkConfig) {
    if (!networkConfig || typeof networkConfig !== 'object') {
      return error(this.res, 'Network Config is not properly provided');
    }
    const { network } = networkConfig;
    if (!network) {
      return error(this.res, 'Network Config is missing network');
    }
    const networkLc = network.toLowerCase();
    const root = path.dirname(__dirname);
    const modPath = root + `/network/${networkLc}/${networkLc}`;
    if (!fs.existsSync(`${modPath}.js`)) {
      return error(this.res, `Network module is missing (${modPath})`);
    }
    const debug = require('debug')("wallet-storage.getNetworkModule");
    debug(`Module ${modPath} ${JSON.stringify(networkConfig)}`);

    return require(modPath)(networkConfig);
  };

  this.fetch = async function () {
    const debug = require('debug')("wallet-info.fetch");
    const modNetwork = this.getNetworkModule(this.json);
    if (!modNetwork) return false;

    // validate network
    debug(`Getting balance from ${JSON.stringify(this.json)}`);
    const networkConfig = this.json;
    const { address } = this.json;
    if (typeof modNetwork.getBalance !== 'function') {
      throw new Error('getAssetsList is not defined for this blockchain network');
    }
    const balances = await modNetwork.getBalance({ walletPublicConfig: { address, networkConfig } });
    return Object.assign({ balances }, this.walletInfo); //{ ...this.walletInfo, balances };
  };

  this.fetchAssetsList = async function() {
    const debug = require('debug')("wallet-info.fetch");
    const modNetwork = this.getNetworkModule(this.json);
    if (!modNetwork) return false;
    debug(`Getting assets from ${JSON.stringify(this.json)}`);
    const networkConfig = this.json;
    const { address } = this.json;
    if (typeof modNetwork.getAssetsList !== 'function') {
      throw new Error('getAssetsList is not defined for this blockchain network');
    }
    const allAssets = await modNetwork.getAssetsList({ walletPublicConfig: { address, networkConfig } });
    // btw there can be another min Value for the asset to be shown, based on cmc.price
    const assets = allAssets.filter(a => (
      a.value === undefined || a.symbol === networkConfig.network || a.value && parseFloat(a.value) > 0.0001
    ));
    return Object.assign({ assets }, this.walletInfo); //{ ...this.walletInfo, assets };
  };

  this.fetchAssetsValue = async function(contractAddress) {
    const debug = require('debug')("wallet-info.fetch");
    const modNetwork = this.getNetworkModule(this.json);
    if (!modNetwork) return false;
    debug(`Getting assets from ${JSON.stringify(this.json)}`);
    const networkConfig = this.json;
    const { address } = this.json;
    if (typeof modNetwork.getAssetValue !== 'function') {
      throw new Error('getAssetValue is not defined for this blockchain network');
    }
    const asset = await modNetwork.getAssetValue({ walletPublicConfig: { address, networkConfig }, contractAddress });
    return Object.assign({ contractAddress, asset }, this.walletInfo); // { ...this.walletInfo, contractAddress, asset };
  };

};

module.exports = WalletInfo;
