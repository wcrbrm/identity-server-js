const { getStorageJson } = require('./../services/storage');


console.log('calling');
getStorageJson();

module.exports = (options) => {
  return (req, res, next) => {
    console.log('STATUS:', JSON.stringify(options));

    const fs = require('fs');
    const installation = (!options.storage || !fs.existsSync(options.storage)) ? 'none' :  'encrypted';

    res.json({ 
      result: "ok", 
      time: (new Date()).getTime(),
      //// TODO: check the file whether it is loaded or not
      //// if not loaded, installation status should be "none", 
      //// and if there is a file, there should be "hardened" in response
      installation,
      require2FA: false,
      locked: false
    });
  };
};
