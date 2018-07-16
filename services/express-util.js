const ok = (res, data) => {
  if (require.main === module) {
    console.log((new Date()).toISOString(), "Response: ", JSON.stringify(data));
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
  console.log( 'ERROR:' + message );
  res.status(500).json({
    status: "error",
    time: (new Date()).getTime(),
    error: message,
    reason
  });
  return false;
};

module.exports = { ok, error, body };
