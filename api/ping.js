module.exports = (req, res, next) => {
  // TODO: include setup status
  res.json({ result: "ok", time: (new Date()).getTime() });
};
