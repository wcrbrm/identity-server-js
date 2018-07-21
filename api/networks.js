const fs = require('fs');
const debug = require('debug')("api/network/terms");
const { error, ok, body } = require("./../services/express-util")('networks');

module.exports = (operation, options) => {
  return (req, res, next) => {
    if (require.main === module) {
      debug('operation:', operation, JSON.stringify(req.params), JSON.stringify(options));
    }

    if (operation === 'list') {
      const config = require('./../config/networks');
      if (!config) return;

      // dummy version was the following:
      // ok(res, { networks: config.Networks });
      
      // but we will show only modules that are attached
      const modules = Object.keys(require('./../network/index'));
      const networks = config.Networks.filter(n => (modules.indexOf(n.value) !== -1));
      ok(res, { networks });

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
                                                                                 