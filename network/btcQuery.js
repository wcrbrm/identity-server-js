const axios = require('axios');
exports.query = ({ method, params, config }) => {
  return new Promise((resolve, reject) => {
    axios({
      url: '/',
      baseURL: config.networkId === 'REGTEST' ? 'http://localhost:18443' : config.rpcRoot,
      method: 'post',
      auth: config.rpcAuth,
      headers: { 'content-type': 'text/plain' },
      data: JSON.stringify({ method, params })
    }).then(response => {
      if (response.data !== undefined && response.data.result !== undefined) {
        resolve(response.data.result);
      } else {
        reject(response);
      }
    }).catch(error => {
      resolve(error.response.data.error);
    });
  });
}