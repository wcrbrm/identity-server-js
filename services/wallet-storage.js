const { error } = require("./express-util")('wallet-storage');
const sha1 = require('js-sha1');
const fs = require('fs');
const path = require('path');

function WalletStorage(json) {
  this.json = json;
  this.seed = json.seed;
  this.res = undefined;

  this.responseStream = function(res) {
    this.res = res;
    return this;
  };

  this.nextIndex = function(network) {
    if (!this.json.wallets) return 0;
    return this.json.wallets
      .filter(w => w.network === network)
      .reduce((accumulator, currentValue) => (
        Math.max(accumulator, currentValue)
      ), -1) + 1;
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
    return require(modPath)(networkConfig);
  };

  this.generate = async function (networkConfig) {
    const debug = require('debug')("wallet-storage.generate");

    const seed = this.seed;
    if (!seed) return error(this.res, 'Seed is missing', 'invalid_seed');
    const modNetwork = this.getNetworkModule(networkConfig);
    if (!modNetwork) return false;

    const network = modNetwork.network;
    const index = this.nextIndex(network) || 0;
    debug(`Generating seed=${seed} network=${network} index=${index}`);

    try {
      // validate network
      const wallet = await modNetwork.create({ seed, index, networkConfig });
      const id = sha1(JSON.stringify(wallet) + '-' + (new Date()).toISOString());
      return { ...wallet, id };
    } catch (e) {
      return error(this.res, e.toString() );
    }
  };
};

module.exports = WalletStorage;
