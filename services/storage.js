const fs = require('fs');
const { error, body } = require('./express-util')('storage');
const { getToken } = require('./../api/auth-helpers');
const { encrypt, decrypt } = require('./encryption');

const validateStorageJson = (res, json) => {
  if (!json.format) {
    return error(res, "Error: Storage file is missing format");
  }
  if (!json.seed) {
    return error(res, "Error: Storage file is missing seed");
  }
  // if (!json.pinCode) {
  //   return error(res, "Error: Storage file is missing pinCode section");
  // }
  return json;
};

const storageExists = (options, res) => {
  const path = options.storage + "/encrypted.storage";
  if (!fs.existsSync(path)) {
    return error(res, 'Error: Storage Not Initialized', 'first_run');
  }
  try {
    const json = JSON.parse(fs.readFileSync(path));
    return { installation: 'not_encrypted', locked: false };
  } catch (e) {
    return { installation: 'encrypted', locked: true };
  }
};

const getStorageJson = ({ options, res, req }) => {
  const authToken = getToken(req);
  const pinCode = body(req).pinCode;

  if (pinCode) {
    const path = options.storage + "/encrypted.storage";
    if (!fs.existsSync(path)) {
      return error(res, 'Error: Storage Not Initialized', 'first_run');
    }
    try {
      const json = JSON.parse(decrypt({ token: fs.readFileSync(path).toString(), passphrase: pinCode }));
      //const json = JSON.parse(fs.readFileSync(path).toString());
      if (!json.format) {
        return error(res, "Error: Storage file is missing format");
      }
      if (!json.seed) {
        return error(res, "Error: Storage file is missing seed");
      }
      if (!json.wallets) {
        return error(res, "Error: Storage file is missing wallets section");
      }
      return json;
    } catch (e) {
      return error(res, "Error: Storage file cannot be parsed");
    }
  } else if (authToken) {
    const token = global.tokens.find(t => t.token === authToken);
    if (!token) {
      return error(res, 'Authentication token not found');
    }
    const { storageId } = token;
    if (!storageId) return error(res, 'Cannot find in-memory storage');
    if (!global.storage) return error(res, 'In-memory storage not initialized');
    
    const json = global.storage[storageId];
    if (!json) return error(res, "In-memory storage doesn't exist");
    
    return validateStorageJson(res, json);
  }
  
};

const ensureExists = dir => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
};


const saveStorageJson = (options, json, pinCode) => {
  if (!pinCode) {
    throw new Error('PIN1 required to encode Storage');
  }
  const updated = (new Date()).toISOString();
  const wallets = json.wallets || [];
  const obj = Object.assign({ updated, wallets }, json); // { ...json, updated, wallets };
  delete obj.pinCode; // do not store pinCode, use it only to decrypt storage

  ensureExists(options.storage);
  const path = options.storage + "/encrypted.storage";
  fs.writeFileSync(path, encrypt({ message: obj, passphrase: pinCode }));
  //fs.writeFileSync(path, JSON.stringify(obj, null, 2));
};

module.exports = {
  error,
  storageExists,
  getStorageJson,
  saveStorageJson,
  validateStorageJson
};
