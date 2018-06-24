module.exports = (req, res, next) => {
  res.json({ 
    result: "ok", 
    time: (new Date()).getTime(),
// TODO: check the file whether it is loaded or not
// if not loaded, installation status should be "none", 
// and if there is a file, there should be "hd-wallet" in response
    installation: "hd-wallet",
    locked: true
  });
};
