const sha1 = require('js-sha1');
const { getStorageJson, saveStorageJson } = require('./../services/storage');
const WalletStorage = require('./../services/wallet-storage');
const WalletInfo = require('./../services/wallet-info');
const { error, ok, body } = require("./../services/express-util")('wallets');

const requireWalletId = (req, res) => {
  if (!req.params.id) {
    error(res, "Error: Wallet ID Expected, but not provided");
    return false;
  }
  return req.params.id;
};

const requireAssetId = (req, res) => {
  if (!req.params.assetId) {
    error(res, "Error: Asset ID Expected, but not provided");
    return false;
  }
  return req.params.assetId;
};

const safeWalletInfo = (wallet) => {
  const info = { ...wallet };
  delete info.privateKey;
  delete info.keyStore;
  return info;
};

module.exports = (operation, options) => {
  return (req, res, next) => {
    if (require.main === module) {
      console.log('operation:', operation, JSON.stringify(req.params), JSON.stringify(options));
    }
    try {

      if (operation === 'list') {

        const json = getStorageJson(options, res);
        if (!json) return;

        const wallets = (json.wallets || [])
        .filter(w => (typeof w === 'object' && (w.network || w.exchange))).map(w => (safeWalletInfo(w)));
        return ok(res, { wallets });

      } else if (operation === 'info') {

        const id = requireWalletId(req, res);
        if (!id) return;
        const json = getStorageJson(options, res);
        if (!json) return;

        const walletsMatch = json.wallets.filter(w => (w.id === id));
        if (walletsMatch) {
          const debug = require('debug')('wallets.info');
          debug('wallets match:', JSON.stringify(walletsMatch[0]));
          const wi = safeWalletInfo(walletsMatch[0]);
          debug("wallet info=" + JSON.stringify(wi));
          ok(res, wi);
        } else {
          error(res, "Wallet Was Not Found by its ID");
        }
        return;
      } else if (operation === 'assetinfo') {

        const id = requireWalletId(req, res);
        if (!id) return;
        const assetId = requireAssetId(req, res);
        if (!assetId) return;
        const json = getStorageJson(options, res);
        if (!json) return;

        const walletsMatch = json.wallets.filter(w => (w.id === id));
        if (walletsMatch) {
          const debug = require('debug')('wallets.assetinfo');
          debug('wallets match:', JSON.stringify(walletsMatch[0]));
          const walletInfo = new WalletInfo(walletsMatch[0]);
          walletInfo.responseStream(res);
          walletInfo.fetchAsset(assetId).then(asset => {
            debug("wallet info=" + JSON.stringify(asset));
            ok(res, asset);
          }).catch( we => {
            error(res, we.toString());
          });

        } else {
          error(res, "Wallet Was Not Found by its ID");
        }

        return;
      } else if (operation === 'assets') {

        const id = requireWalletId(req, res);
        if (!id) return;
        const json = getStorageJson(options, res);
        if (!json) return;

        const walletsMatch = json.wallets.filter(w => (w.id === id));
        if (walletsMatch) {
          const debug = require('debug')('wallets.assets');
          debug('wallets match:', JSON.stringify(walletsMatch[0]));
          const walletInfo = new WalletInfo(walletsMatch[0]);
          walletInfo.responseStream(res);
          walletInfo.fetch().then(assets => {
            const wi = safeWalletInfo(assets);
            debug("wallet info=" + JSON.stringify(wi));
            ok(res, wi);
          }).catch( we => {
            error(res, we.toString());
          });
        } else {
          error(res, "Wallet Was Not Found by its ID");
        }
        return;
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
        debug("generating wallet name=", name);
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

    } catch (modex) {
      error(res, modex.toString());
    }
  };
};
