const fs = require('fs');
const debug = require('debug')("api/network/terms");
const { error, ok } = require("./../services/express-util")('networks');

module.exports = (operation, options) => {
  return (req, res, next) => {
    try {
      if (require.main === module) {
        debug('operation:', operation, JSON.stringify(req.params), JSON.stringify(options));
      }

      if (operation === 'list') {
        const config = require('./../config/networks');
        if (!config) return;
        const configExchanges = require('./../config/exchanges');
        if (!configExchanges) return;

        // dummy version was the following:
        // ok(res, { networks: config.Networks });

        // but we will show only modules that are attached
        const modules = Object.keys(require('./../network/index'));
        const networks = config.Networks.filter(n => (modules.indexOf(n.value) !== -1));

        // but we will show only modules that are attached
        const modulesExchanges = Object.keys(require('./../exchanges/index'));
        const exchanges = configExchanges.Exchanges.filter(n => (modulesExchanges.indexOf(n.value) !== -1));

        return ok(res, { networks, exchanges });

      } else if  (operation === 'address') {

        const config = require('./../config/networks');
        if (!config) return;
        const networkId = req.params.networkId;
        const found = config.Networks.filter(n => n.value === networkId)[0];
        if (!found) { error(res, 'No such network'); return; }
        const address = req.params.address;
        if (!address) { error(res, 'Address not provided'); }

        const module = require('./../network/index')[networkId]({ network: networkId });
        if (!module) {
          return error(res, 'No module implemented for network ' + networkId);
        }
        if ((typeof module.isValidAddress) !== 'function') {
          return error(res, 'isValidAddress is not implemented for ' + networkId
            + ', module=' + JSON.stringify(module));
        }
        const networkConfig = req.body || { network: networkId, testnet: false };
        const objResult = module.isValidAddress({ address, networkConfig });
        return ok(res, Object.assign({ address }, objResult)); // { address, ...objResult }

      } else if (operation === 'terms') {
        const config = require('./../config/networks');
        if (!config) return;
        const networkId = req.params.networkId;
        const found = config.Networks.filter(n => n.value === networkId)[0];
        if (!found) { error(res, 'No such network'); return; }
        if (!found.terms) { error(res, 'No terms for this network'); return; }
        const path = './terms/' + networkId + '.terms.md';
        if (!fs.existsSync(path)) { error(res, 'Terms were not found for this network ' + path); return; }

        debug("config of " + JSON.stringify(networkId) + ": " + JSON.stringify(found));
        res.send(fs.readFileSync(path));
        return;

      } if (operation === 'status') {
        // network status later
      }

      next();

    } catch (modex) {
      debug('ERROR:', modex);
      error(res, modex.toString());
    }
  };
};
