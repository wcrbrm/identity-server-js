const debug = require('debug')("api/exchanges");
const { error, ok, body } = require("./../services/express-util")('exchanges');

module.exports = (operation, options) => {
  return (req, res, next) => {
    if (require.main === module) {
      debug('operation:', operation, JSON.stringify(req.params), JSON.stringify(options));
    }

    if (operation === 'list') {
      const config = require('./../config/exchanges');
      if (!config) return;
      ok(res, { networks: config.Exchanges });
    }

    next();
  };
};
                                                                                 