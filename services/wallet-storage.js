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
    const debug = require('debug')('wallet-storage.next-index');
    return this.json.wallets
      .filter(w => (w && w.network === network))
      .reduce((accumulator, w) => {
        debug("accumulator=", accumulator, "index=", w.index);
        return Math.max(accumulator, w.index)
      }, -1) + 1;
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

  this.generate = async function (name, networkConfig) {
    if (!name) return error(this.res, 'Name is missing', 'missing_name');

    const debug = require('debug')("wallet-storage.generate");
    debug(`Generating ${JSON.stringify(networkConfig)}`);

    const seed = this.seed;
    if (!seed) return error(this.res, 'Seed is missing', 'invalid_seed');
    const modNetwork = this.getNetworkModule(networkConfig);
    if (!modNetwork) return false;

    const network = networkConfig.network;
    const index = this.nextIndex(network) || 0;
    debug(`Creating wallet '${name}' from seed=${seed} network=${network} index=${index}`);

    // validate network
    const wallet = await modNetwork.create({ seed, index, networkConfig });
    const id = sha1(JSON.stringify(wallet) + '-' + (new Date()).toISOString());
    return Object.assign({ id, index, name }, networkConfig, wallet); // { ...networkConfig, ...wallet, id, index, name };
  };
};

module.exports = WalletStorage;
