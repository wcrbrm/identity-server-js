const fs = require('fs');
const sha1 = require('js-sha1');
const debug = require('debug')("api/network/terms");
const { getStorageJson, saveStorageJson } = require('./../services/storage');
const { error, ok, body } = require("./../services/express-util")('networks');

module.exports = (operation, options) => {
  return (req, res, next) => {
    if (require.main === module) {
      debug('operation:', operation, JSON.stringify(req.params), JSON.stringify(options));
    }

    if (operation === 'list') {
      const config = require('./../config/networks');
      if (!config) return;
      ok(res, { networks: config.Networks });

    } if (operation === 'terms') {
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

    } if (operation === 'status') {
    }

    next();
  };
};
                                                                                 