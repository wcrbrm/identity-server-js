const debug = require('debug')("api/auth");
const { getStorageJson } = require('../services/storage');
const { ok, error } = require('../services/express-util')('api/auth');
const { now, saveStorageJsonToMemory, saveAuthTokenToMemory, getToken } = require('./auth-helpers');

module.exports = (operation, options) => {
  return (req, res, next) => {
    if (operation === 'unlock') {
      // decode storage with pin1
      const json = getStorageJson({ options, req, res });
      if (json) {
        saveStorageJsonToMemory(json).then(storageId => {
          saveAuthTokenToMemory({ storageId }).then(token => {
            ok(res, token);
          });
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
      const openRoutes = [ '/api/status', '/api/networks', '/api/auth/unlock', '/api/storage' ];

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
      const tokenHeader = getToken(req);
      saveAuthTokenToMemory({ tokenHeader }).then(token => {
        ok(res, token);
      });
      return;
    }
    next();
  };
};
