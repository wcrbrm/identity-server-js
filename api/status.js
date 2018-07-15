const { getStorageJson } = require('./../services/storage');
const { ok } = require('./../services/express-util');

module.exports = (options) => {
  return (req, res, next) => {
    const json = getStorageJson(options, res);
    if (!json) return;
    ok(res, { 
      installation: json.format,
      require2FA: false,
      locked: false
    });
  };
};
