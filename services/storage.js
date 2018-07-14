const fs = require('fs');
const { error } = require('./express-util');

const getStorageJson = (options, response) => {
  const path = options.storage + "/encrypted.storage";
  if (!fs.fileExistsSync(path)) {
    return err(res, 'Error: Storage Not Initialized');
  }
  try {
    const json = JSON.parse(fs.readFileSync(path));
    if (!json.format) {
      return err(res, "Error: Storage file is missing format");
    }
    if (!json.seed) {
      return err(res, "Error: Storage file is missing seed");
    }
    if (!json.wallets) {
      return err(res, "Error: Storage file is missing wallets section");
    }
    return json;
  } catch (e) {
    return err(res, "Error: Storage file cannot be parsed");
  }
};

const saveStorageJson = (options, json) => {
  const updated = (new Date()).toISOString();
  const wallets = json.wallets || [];
  const obj = { ...json, updated, wallets };

  const path = options.storage + "/encrypted.storage";
  fs.writeFileSync(path, JSON.stringify(obj, null, 2));

};

module.exports = {
  error, 
  getStorageJson,
  saveStorageJson
};
