const sha1 = require('js-sha1');
const { getStorageJson, saveStorageJson } = require('./storage');
const { error, ok, body } = require("./express-util");

module.exports = (operation, options) => {
  return (req, res, next) => {
    console.log('operation:', operation, JSON.stringify(options));

    if (operation === 'list') {

      const json = getStorageJson(options, res);
      if (!json) return;
      ok(res, { wallets: json.wallets });

    } else if (operation === 'create') {

      const json = getStorageJson(options, res);
      if (!json) return;

      const payload = JSON.parse(req.body);
      if (payload) {
        const id = sha1(JSON.stringify(payload) + '-' + (new Date()).toISOString());
        const newWallet = { ...payload, id };
        json.wallets.push(newWallet);
        try {
          saveStorageJson(options, json);
          ok(res, {id: newWallet });  
        } catch (e) {
          error(res, "Error on save: " + e.toString());
        }
      } else {
	error(res, "Error: Expected payload");
      }
    }

    next();
  };
};
