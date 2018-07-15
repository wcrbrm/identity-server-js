const { saveStorageJson } = require('./../services/storage');
const { ok, body, error } = require('./../services/express-util');

const validateStorageJson = (res, json) => {
  if (!json.format) {
    return error(res, "Error: Storage file is missing format");
  }
  if (!json.seed) {
    return error(res, "Error: Storage file is missing seed");
  }
  if (!json.pinCode) {
    return error(res, "Error: Storage file is missing pinCode section");
  }
  return json;
}

module.exports = (options) => {
  return (req, res, next) => {
    const json = body(req);
    if (!validateStorageJson(res, json)) return;
    saveStorageJson(options, json);
    ok(res, { 
      format: json.format,
      installed: true
    });
  };
};
