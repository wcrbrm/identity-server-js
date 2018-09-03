const fs = require('fs');
const { error } = require('./express-util')('storage');

const getStorageJson = (options, res) => {
  const path = options.storage + "/encrypted.storage";
  if (!fs.existsSync(path)) {
    return error(res, 'Error: Storage Not Initialized', 'first_run');
  }
  try {
    const json = JSON.parse(fs.readFileSync(path));
    if (!json.format) {
      return error(res, "Error: Storage file is missing format");
    }
    if (!json.pinCode) {
      return error(res, "Error: Storage file is missing pinCode");
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
};

const ensureExists = dir => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
};


const saveStorageJson = (options, json) => {
  const updated = (new Date()).toISOString();
  const wallets = json.wallets || [];
  const obj = Object.assign({ updated, wallets }, json); // { ...json, updated, wallets };

  ensureExists(options.storage);
  const path = options.storage + "/encrypted.storage";
  fs.writeFileSync(path, JSON.stringify(obj, null, 2));
};

module.exports = {
  error, 
  getStorageJson,
  saveStorageJson
};
