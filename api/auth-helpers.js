const UIDGenerator = require('uid-generator');

const now = () => Math.round((new Date()).getTime() / 1000); // seconds
const expiryIn = 15; //minutes

const saveStorageJsonToMemory = async (json) => {
  const generator = new UIDGenerator();
  // Generate storage id:
  const storageId = await generator.generate();
  global.storage = global.storage || {};
  // json is stored by unique id in global variable
  global.storage[storageId] = json;
  return storageId;
}

const saveAuthTokenToMemory = async ({ storageId, tokenHeader }) => {
  if (!storageId && !tokenHeader) return false;

  let token = {};
  global.tokens = global.tokens || [];
  const generator = new UIDGenerator();

  if (tokenHeader) {
    token = global.tokens.find(t => t.token === tokenHeader);
    if (!token) return false;
  }
  
  const uid = await generator.generate();
  token.token = uid;

  const expiry = now() + expiryIn * 60;
  token.expiry = expiry;

  const timeout = setTimeout(() => {
    delete global.storage[storageId];
  }, expiryIn * 60 * 1000);
  if (token.timeout) {
    clearTimeout(token.timeout);
  }
  token.timeout = timeout;

  token.storageId = token.storageId || storageId;

  token.scope = token.scope || [];

  if (!tokenHeader) {
    global.tokens.push(token);
  }

  return { token: token.token, expiry: token.expiry };
};

const getToken = (req) => {
  const authorizationHeader = req.headers['authorization'];
  if (authorizationHeader) {
    const headerParts = authorizationHeader.split(' ');
    if (headerParts[0] === 'Bearer' || headerParts[1]) {
      return headerParts[1];
    }
  }
  return false;
};

module.exports = {
  now,
  saveStorageJsonToMemory,
  saveAuthTokenToMemory,
  getToken
};