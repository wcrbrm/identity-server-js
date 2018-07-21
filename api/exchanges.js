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
      // ok(res, { exchanges: config.Exchanges });

      // but we will show only modules that are attached
      const modules = Object.keys(require('./../exchanges/index'));
      const exchanges = config.Exchanges.filter(n => (modules.indexOf(n.value) !== -1));
      ok(res, { exchanges });

    }

    next();
  };
};
                                                                                 