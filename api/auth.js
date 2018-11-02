const UIDGenerator = require('uid-generator');
const debug = require('debug')("api/auth");
const { getStorageJson } = require('../services/storage');
const { ok, error } = require('../services/express-util')('api/auth');

const now = () => Math.round((new Date()).getTime() / 1000);
const expiryIn = 15; //minutes

module.exports = (operation, options) => {
  return (req, res, next) => {
    if (operation === 'unlock') {
      const json = getStorageJson(options, res);
      if (!json) return;

      const storedPin = json.pinCode;
      const receivedPin = req.body.pinCode;

      if (storedPin === receivedPin) {
        // Generate new token
        (new UIDGenerator()).generate().then(uid => {
          // Token expires in 15 min
          const expiry = now() + expiryIn * 60;
          const token = { token: uid, expiry, scope: [] };

          global.tokens = global.tokens || [];
          global.tokens.push(token);

          ok(res, token);
        });
        return;
      } else {
        return error(res, 'Pin code incorrect', null, 400);
      }

    } else if (operation === 'lock') {
      delete global.tokens;
      return ok(res);

    } else if (operation === 'validate') {
      const path = req.path;
      const openRoutes = [ '/api/status', '/api/networks', '/api/auth/unlock' ];

      if (!openRoutes.includes(path)) {
        const authorizationHeader = req.headers['authorization'];
        if (!authorizationHeader) {
          return error(res, 'Forbidden', 'No authorization token', 403);
        }

        const headerParts = authorizationHeader.split(' ');
        if (!headerParts[0] === 'Bearer' || !headerParts[1]) {
          return error(res, 'Forbidden', 'Malformed authorization token', 403);
        }

        const receivedToken = headerParts[1];
        global.tokens = global.tokens || [];
        const existingTokens = global.tokens;
        const token = existingTokens.find(t => t.token === receivedToken);
        if (!token || token.expiry < now()) {
          return error(res, 'Forbidden', 'Authorization token not found or expired', 403);
        }
      }
    } else if (operation === 'refresh') {
      (new UIDGenerator()).generate().then(uid => {
        // Token expires in 15 min
        const expiry = now() + expiryIn * 60;
        const token = { token: uid, expiry, scope: [] };

        global.tokens = global.tokens || [];
        global.tokens.push(token);

        ok(res, token);
      });
      return;
    }
    next();
  };
};
