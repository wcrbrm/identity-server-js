module.exports = module => {

  const debug = require('debug')(module);

  const ok = (res, data) => {
    if (require.main === module) {
      debug("Response: " + JSON.stringify(data));
    }
    res.json({
      status: "ok",
      time: (new Date()).getTime(),
      data
    });
  };

  const body = (req) => {
    if (typeof req.body === 'object') return req.body;
    try {
      return JSON.parse(req.body);
    } catch (e) {
    }
  };

  const error = (res, message, reason) => {
    debug( message );
    res.status(500).json({
      status: "error",
      time: (new Date()).getTime(),
      error: message,
      reason
    });
    return false;
  };

  return { ok, error, body };
};
