const sha1 = require('js-sha1');
const path = require('path');
const { getStorageJson, saveStorageJson } = require('./../services/storage');
const WalletStorage = require('./../services/wallet-storage');
const WalletInfo = require('./../services/wallet-info');
const { error, ok, body } = require("./../services/express-util")('wallets');
const { pdf } = require('./../services/pdf');


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
          walletInfo.fetchAssetsValue(assetId).then(assetInfo => {
            debug("wallet info=" + JSON.stringify(assetInfo));
            ok(res, assetInfo);
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
          walletInfo.fetchAssetsList().then(assets => {
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

          const config = require('./../config/networks');
          if (!config) return;
          if (!payload.name) { error(res, 'Name must be provided'); return; }
          const idSuffix = '-' + (new Date()).toISOString();// could that be empty?
          let resultToReturn = null;

          if (payload.exchange) {

            // CASE WHEN WE ARE IMPORTING EXCHANGE CREDENTIALS

            const { exchange } = payload;
            const found = config.Exchange.filter(n => n.value === exchange)[0];
            if (!found) { error(res, 'No such exchange'); return; }
            const module = require('./../exchanges/index')[exchange]({ exchange });
            if (!module) {
              return error(res, 'No module implemented for exchange ' + exchange);
            }
            const objResult = module.isValidCredentials({ payload });
            if (!objResult.valid || objResult.error) { return ok(res, objResult); }

            const { result } = objResult;
            if (!result){ return error(res, 'Missing result in modules isValidCredentials'); }

            const id = sha1(JSON.stringify(result) + idSuffix);
            resultToReturn = { ...result, id };
            json.wallets.push(resultToReturn);

          } else {
            // CASE WHEN WE ARE IMPORTING THE WALLET.
            // OR ADDING WALLET FOR WATCHING

            if (!payload.network) { error(res, 'Network must be provided'); return; }
            const found = config.Networks.filter(n => n.value === payload.network)[0];
            if (!found) { error(res, 'No such network'); return; }
            const module = require('./../network/index')[payload.network]({ network: payload.network });
            if (!module) {
              return error(res, 'No module implemented for network ' + payload.network);
            }

            if (payload.privateKey) {
              // if there is a private Key given, we should validate
              if ((typeof module.isValidPrivateKey) !== 'function') {
                return error(res, 'isValidPrivateKey is not implemented for ' + networkId
                  + ', module=' + JSON.stringify(module));
              }

              const { network, networkId = '', testnet = false, privateKey } = payload;
              const networkConfig = { network, networkId, testnet };
              const objResult = module.isValidPrivateKey({ privateKey, networkConfig });
              if (!objResult.valid || objResult.error) { return ok(res, objResult); }

              if (!config.multiAccount && !objResult.address) {
                return error(res, 'Address must be generated in isValidPrivateKey');
              }
              if (objResult.address) payload.address = objResult.address;
              if (payload.password) {
                // TODO： decrypt privateKey with the given password (BIP38)
                delete payload.password;
              }
            }
            const id = sha1(JSON.stringify(payload)  + idSuffix);
            resultToReturn = { ...payload, id };
            json.wallets.push(resultToReturn);
          }

          try {
            saveStorageJson(options, json);
            ok(res, safeWalletInfo(resultToReturn));
          } catch (e) {
            error(res, "Error on save: " + e.toString());
          }
        } else {
          error(res, "Error: Expected payload");
        }
        return;

      } else if (operation === 'pdf') {
        const json = getStorageJson(options, res);
        if (!json) return;

        const walletId = req.params.id;
        pdf({ res, walletId, json }).then(doc => {
          res.setHeader('Content-disposition', 'inline');
          res.setHeader('Content-type', 'application/pdf');
          doc.pipe(res);
        }).catch(e => {
          error(res, `Error: ${e.message}`);
        });

        return;
      }

      next();

    } catch (modex) {
      error(res, modex.toString());
    }
  };
};
