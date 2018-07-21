const axios = require('axios');
const createDebug = require('debug');
const debugV1 = createDebug('coinmarketcap.v1');
const debugV2 = createDebug('coinmarketcap.v2');

const __SYMBOL_CACHE = {};

const parseDataV1 = (data) => {
  for (let i = 0; i < data.length; i++ ) {
    const sym = data[i];
    if (sym && sym.symbol) __SYMBOL_CACHE[sym.symbol] = sym;
  }
  debugV1(Object.keys(__SYMBOL_CACHE).length + ' symbols loaded from CoinMarketCap');
};

const parseDataV2 = (data, offset, limit = 100) => {
  let i = 0;
  Object.keys(data).forEach(key => {
    const sym = data[key];
    if (sym && sym.symbol) __SYMBOL_CACHE[sym.symbol] = sym;
  });
  debugV2(Object.keys(__SYMBOL_CACHE).length + ' symbols loaded from CoinMarketCap');
};

const loadPage = (offset, limit = 100) => {
 // v2 will require paging
};

const load = () => {
  return new Promise((resolve, reject) => {
    axios.get('https://api.coinmarketcap.com/v1/ticker/?limit=100000')
      .then((response) => {
        if (response.data) {
          const { data } = response;
	  parseDataV1(data);
          resolve(true);
        }
      })
      .catch((error) => {
        debugV1(error);
        reject(error)
      });
  });
};

const getTicker = symbol => (__SYMBOL_CACHE[symbol]);

module.exports = { load, getTicker };