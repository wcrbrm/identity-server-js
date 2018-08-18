const axios = require('axios');
const ElectrumClient = require('electrum-client');
const URL = require('url');

const baseUrlFromConfig = (config) => {
  // TODO: more cases should be handled
  return config.networkId === 'REGTEST' && !config.rpc 
          ? 'http://localhost:18443' 
          : getRpcUrl(config.rpc);
};

const authFromConfig = (config) => {
  // TODO: more cases should be handled
  if (config.rpcAuth) {
    return config.rpcAuth;
  };
  return getRpcAuth(config.rpc);
};

const getRpcUrl = (url) => {
  const urlParts = URL.parse(url);
  return `${urlParts.protocol}//${urlParts.hostname}:${urlParts.port}`;
}

const getRpcAuth = (url) => {
  const urlParts = URL.parse(url);
  let username = '';
  let password = '';
  if (urlParts.auth) {
    username = urlParts.auth.split(':')[0];
    password = urlParts.auth.split(':')[1];
  }
  return {
    username,
    password
  };
}

const getApiConf = (url) => {
  const urlParts = URL.parse(url);
  return {
    host: urlParts.hostname,
    port: urlParts.port,
    protocol: urlParts.protocol.replace(':', '')
  };
}

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
  }).catch(error => {
    if (error.response)
      throw error.response.data.error; // this is extremely weird
    else 
      throw error;
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

const isRegTestRunning = ({ config }) => (getBlockChainInfo({ config }));

const isElectrumRunning = async ({ config }) => {
  const { port, host, protocol } = config;
  if (!port || !host || !protocol) 
    return false;

  const ecl = new ElectrumClient(port, host, protocol);
  try {
    await ecl.connect();
    const version = await ecl.server_version();
    await ecl.close();
    return version; 
  } catch (e) {
    if (e.code == 'ECONNREFUSED') return false;
    throw e;
  }
};

module.exports = {
  query,
  getBlockChainInfo,
  isRegTestRunning,
  isElectrumRunning,
  baseUrlFromConfig,
  authFromConfig,
  getApiConf
};
