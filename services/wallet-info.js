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
    const balance = await modNetwork.getBalance({ walletPublicConfig: { address, networkConfig } });
    return { ...this.walletInfo, balance };
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
    const assets = await modNetwork.getAssetsList({ walletPublicConfig: { address, networkConfig } });
    return { ...this.walletInfo, assets };
  };

};

module.exports = WalletInfo;
