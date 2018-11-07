const debug = require('debug')("api/status");
const { storageExists } = require('./../services/storage');
const { ok } = require('./../services/express-util')('api/status');

module.exports = (options) => {
  return (req, res, next) => {
    debug("requesting status");
    const exists = storageExists(options, res);
    if (!exists) return;
    ok(res, exists);
  };
};
