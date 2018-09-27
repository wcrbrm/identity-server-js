module.exports = ({ network = 'ETH' }) => {
  const Web3 = require("web3");
  const debug = require('debug')('eth.networkhelper');
  const { httpEndpointFromConfig } = require('./ethereum-networkhelper')({ network });

  const getWeb3Client = (config) => {
    const httpEndpoint = httpEndpointFromConfig(config);
    debug('web3 endpoint', httpEndpoint);
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

  return {
    getWeb3Client,
    isNetworkRunning,
  };
};