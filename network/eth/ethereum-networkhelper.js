const Web3 = require("web3");

const httpEndpointFromConfig = (config) => {
  if (config.rpcRoot) {
    return config.rpcRoot;
  }
  return 'http://127.0.0.1:8545';
};

const getWeb3Client = (config) => {
    const httpEndpoint = httpEndpointFromConfig(config);
    console.log('http=', httpEndpoint);
    const web3client = new Web3(new Web3.providers.HttpProvider(httpEndpoint));
    return web3client;
};

const isNetworkRunning = async ({ config }) => {
  try {
    const httpEndpoint = httpEndpointFromConfig(config);
    const web3client = new Web3(new Web3.providers.HttpProvider(httpEndpoint));
    return web3client.isConnected();
  } catch (e) {
    if (e.code == 'ECONNREFUSED') return false;
    console.log(e);
    throw e;
  }
};

module.exports = {
    httpEndpointFromConfig,
    getWeb3Client,
    isNetworkRunning
};