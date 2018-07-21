const debug = require('debug')("api/status");
const { getStorageJson } = require('./../services/storage');
const { ok } = require('./../services/express-util')('api/status');

module.exports = (options) => {
  return (req, res, next) => {
    debug("requesting status");
    const json = getStorageJson(options, res);
    if (!json) return;
    ok(res, { 
      installation: json.format,
      locked: false
    });
  };
};
