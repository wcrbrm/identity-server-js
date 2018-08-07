module.exports = ({ network = 'ETH' }) => {
  const Web3 = require("web3");
  const axios = require('axios');

  const httpEndpointFromConfig = (config) => {
    if (config.rpcRoot) {
      return config.rpcRoot;
    }
    return 'http://127.0.0.1:8545';
  };

  const getWeb3Client = (config) => {
    const httpEndpoint = httpEndpointFromConfig(config);
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

  const etherscanEndpointFromConfig = (config) => {
    if (config.api) {
      return config.api;
    }
    return 'http://127.0.0.1:9911';
  };

  const getEtherscanClient = (config) => {
    const rootUrl = etherscanEndpointFromConfig(config);

    const isConnected = async () => {
      const url = `${rpcUrl}/api?module=account`;
      console.log('url=', url);
      const result = await axios.get(url)
      console.log('isConnected', result);
    };

    const getTokenContracts = async (address) => {
      // return token contracts that inter
      // { contractAddress, tokenSymbol, tokenName, tokenDecimal }
      return [];
    };
    return {
      isConnected,
      getTokenContracts
    }
  }

  const isEtherscanRunning = async ({ config }) => {
    try {
      console.log('check isEtherscanRunning...');
      const client = getEtherscanClient(config);

      return client.isConnected();
    } catch (e) {
      if (e.code == 'ECONNREFUSED') return false;
      console.log(e);
      throw e;
    }
  };

  return {
    httpEndpointFromConfig,
    etherscanEndpointFromConfig,
    getWeb3Client,
    getEtherscanClient,
    isNetworkRunning,
    isEtherscanRunning
  };
}
