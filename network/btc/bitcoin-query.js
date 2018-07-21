const axios = require('axios');

const baseUrlFromConfig = (config) => {
  // TODO: more cases should be handled
  return config.networkId === 'REGTEST' ? 'http://localhost:18443' : config.rpcRoot;
};

const authFromConfig = (config) => {
  // TODO: more cases should be handled
  return config.rpcAuth;
};

const query = ({ method, params, config }) => (
  axios({
    url: '/',
    baseURL: baseUrlFromConfig(config),
    method: 'post',
    auth: authFromConfig(config),
    headers: { 'content-type': 'text/plain' },
    data: JSON.stringify({ method, params })
  }).then(response => {
    if (response.data && response.data.result) {
      return response.data.result;
    }
  })
);

const getBlockChainInfo = async ({ config }) => {
  try {
    return await query({ method: 'getblockchaininfo', params: [], config });
  } catch (e) {
    // console.log(Object.keys(e), e.code, e.errno);
    if (e.code == 'ECONNREFUSED') return false;
    throw e;
  }
};

const isRegTestRunning = () => (getBlockChainInfo({ config: { networkId: 'REGTEST' }}));


module.exports = {
  query,
  getBlockChainInfo,
  isRegTestRunning,
  baseUrlFromConfig,
  authFromConfig
};