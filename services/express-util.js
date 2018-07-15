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
  try {
    return JSON.parse(req.body);
  } catch (e) {
  }
};


const error = (res, message) => {
  console.log( (new Date()).toISOString(), message );
  return res.status(500).json({
    status: "error",
    time: (new Date()).getTime(),
    error: message
  });
};

module.exports = { ok, error, body };
