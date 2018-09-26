module.exports = ({ network = 'ETH' }) => {
  const Web3 = require("web3");
  const debug = require('debug')('eth.networkhelper');
  const { Networks } = require('./../../config/networks');
  const { testnets } = Networks.filter(f => (f.value === network))[0];

  const httpEndpointFromConfig = (config) => {
    if (config.testnet) {
      if (config.networkId) {
        const testNetDescriptor = testnets.find(ntwrk => {
          if (ntwrk.value === config.networkId) return ntwrk;
        });
        if (typeof testNetDescriptor === 'undefined') {
          throw new Error('Ethereum Test Network is not defined');
        }
        if (!testNetDescriptor.rpc) {
          throw new Error('Ethereum Test Network has no RPC root defined');
        }
        return testNetDescriptor.rpc;
      } else if (config.rpc) {
        return config.rpc;
      }
    }
    return 'https://mainnet.infura.io/56VWha01KDTpZ0kRTDCN';
  };

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

  const { getEtherscanClient } = require('./etherscan-client')({ network });

  const isEtherscanRunning = async ({ config }) => {
    const client = getEtherscanClient(config);
    return client.isConnected();
  };

  return {
    // Layer 1 - RPC functions
    httpEndpointFromConfig,
    getWeb3Client,
    isNetworkRunning,

    // Layer 2 - Etherscan functions
    getEtherscanClient,
    isEtherscanRunning
  };
}
