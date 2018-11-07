const debug = require('debug')("api/storage");
const { saveStorageJson, getStorageJson, validateStorageJson } = require('./../services/storage');
const { ok, body, error } = require('./../services/express-util')('api/storage');
const { saveStorageJsonToMemory, saveAuthTokenToMemory } = require('./auth-helpers');

module.exports = (options) => {
  return (req, res, next) => {
    const json = body(req);
    if (!validateStorageJson(res, json)) return;
    saveStorageJson(options, json, json.pinCode);
    
    // Log in user for the first time
    const json2 = getStorageJson({ options, res, req });
    if (json2) {
      saveStorageJsonToMemory(json2).then(storageId => {
        saveAuthTokenToMemory({ storageId }).then(token => {
          ok(res, { 
            format: json2.format,
            installed: true,
            token
          });
        });
      });
    }
    return;
  };
};


