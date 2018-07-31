const sha1 = require('js-sha1');
const { getStorageJson, saveStorageJson } = require('./../services/storage');
const WalletStorage = require('./../services/wallet-storage');
const { error, ok, body } = require("./../services/express-util")('wallets');

const requireWalletId = (req, res) => {
  if (!req.params.id) {
    error(res, "Error: Wallet ID Expected, but not provided");
    return false;
  }
  return req.params.id;
};

const safeWalletInfo = (wallet) => {
  const info = { ...wallet };
  delete info.privateKey;
  delete info.keyStore;
  delete info.path;
  return info;
};

module.exports = (operation, options) => {
  return (req, res, next) => {
    if (require.main === module) {
      console.log('operation:', operation, JSON.stringify(req.params), JSON.stringify(options));
    }

    if (operation === 'list') {

      const json = getStorageJson(options, res);
      if (!json) return;

      const wallets = (json.wallets || [])
      .filter(w => (typeof w === 'object' && (w.network || w.exchange))).map(w => (safeWalletInfo(w)));
      ok(res, { wallets });

    } else if (operation === 'info') {

      const id = requireWalletId(req, res);
      if (!id) return;
      const json = getStorageJson(options, res);
      if (!json) return;
      const walletsMatch = json.wallets.filter(w => (w.id === id));
      if (walletsMatch) {
        ok(res, safeWalletInfo(walletsMatch[0]));
      } else {
        error(res, "Wallet Was Not Found by its ID");
      }

    } else if (operation === 'delete') {

      const id = requireWalletId(req, res);
      if (!id) return;
      const json = getStorageJson(options, res);
      if (!json) return;
      const wallets = json.wallets.filter(w => (w.id !== id));
      const jsonUpdated = { ...json, wallets };
      saveStorageJson(options, jsonUpdated);
      return ok(res, { operation: "deleted", length: wallets.length });

    } else if (operation === 'generate') {
      const { name, network, networkId, testnet } = req.body;
      const json = getStorageJson(options, res);
      if (!json) return;

      const walletStorage = new WalletStorage(json);
      walletStorage.responseStream(res);
      const debug = require('debug')('wallets.generate');

      walletStorage.generate(name, { network, networkId, testnet }).then(newWallet => {
        debug('newWallet=', newWallet);
        if (!newWallet) return;
        json.wallets.push(newWallet);
        try {
          saveStorageJson(options, json);
          ok(res, safeWalletInfo(newWallet));
        } catch (e) {
          error(res, "Error on generating wallet: " + e.toString());
        }
      }).catch(e => (error(res, e.toString())));
      return;

    } else if (operation === 'append') {

      const json = getStorageJson(options, res);
      if (!json) return;

      const payload = body(req);
      if (payload) {
        const id = sha1(JSON.stringify(payload) + '-' + (new Date()).toISOString());
        const newWallet = { ...payload, id };
        json.wallets.push(newWallet);
        try {
          saveStorageJson(options, json);
          ok(res, safeWalletInfo(newWallet));
        } catch (e) {
          error(res, "Error on save: " + e.toString());
        }
      } else {
	      error(res, "Error: Expected payload");
      }
      return;
    }

    next();
  };
};
