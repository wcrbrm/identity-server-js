module.exports = ({ network = 'ETH' }) => {
  const Web3 = require("web3");
  const axios = require('axios');
  const debug = require('debug')('eth.networkhelper');
  const { Networks } = require('./../../config/networks');
  const { apiKeys, testnets } = Networks.filter(f => (f.value === network))[0];
// console.log('testnets=', testnets);

  const httpEndpointFromConfig = (config) => {
    if (config.testnet) {
      if (config.networkId) {
        const testNetDescriptor = testnets[config.networkId];
        if (typeof testNetDescriptor === 'undefined') {
          throw new Error('Ethereum Test Network is not defined');
        }
        if (!testNetDescriptor.rpcRoot) {
          throw new Error('Ethereum Test Network has no RPC root defined');
        }
        return testNetDescriptor.rpcRoot;
      } else if (config.rpcRoot) {
        return config.rpcRoot;
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

  const etherscanEndpointFromConfig = (config) => {
    if (config.testnet) {
      if (config.api) {
        return config.api;
      }
      if (config.networkId) {
        const testNetDescriptor = testnets[config.networkId];
        if (typeof testNetDescriptor === 'undefined') {
          throw new Error('Ethereum Test Network is not defined');
        }
        if (!testNetDescriptor.api) {
          throw new Error('Ethereum Test Network has no API root defined');
        }
        return testNetDescriptor.api;
      }
      return 'http://127.0.0.1:9911';
    }
    return 'https://api.etherscan.io/';
  };

  const withApiKey = (url) => {
    if (!apiKeys || apiKeys.length === 0) {
      throw new Error('Etherscan API Keys were not found');
    }
    const randomElement = arr => (arr[Math.floor(Math.random() * arr.length)]);
    const apiKey = randomElement(apiKeys);
    if (!apiKey) {
      throw new Error('API Key could not be chosen for EtherScan');
    }
    return url + ( url.indexOf('?') !== -1 ?  '&' : '?') + 'apiKey=' + apiKey;
  };

  const getEtherscanClient = (config) => {
    const rootUrl = etherscanEndpointFromConfig(config);
    debug('etherscan endpoint', rootUrl);

    const isConnected = async () => {
      const url = `${rootUrl}/api?module=account`;
      try {
        const result = await axios.get(url)
        return true;
      } catch(e) {
        if (e.code == 'ECONNREFUSED') return false;
        if (e.request && e.request.statusText) {
          const { code } = e.request.statusText;
          if (code === 'ECONNREFUSED') return false;
        }
        throw e;
      }
      return false;
    };

    const getTokenContracts = async (address) => {
      // return token contracts that was sending any token to that address
      const url = withApiKey(`${rootUrl}/api?module=account&to=${address}&action=tokentx&startblock=0&endblock=99999999&limit=10000`);
      // console.log('URL=', url);
      const response = await axios.get(url);
      const { data } = response;
      const { result, status } = data;
      if (parseInt(status, 10) !== 1) throw new Error('Etherscan response error: ' + result);

      const r = result
        .filter(f => (f.to === address))
        .map(({ contractAddress, tokenSymbol, tokenName, tokenDecimal }) => (
          {contractAddress, tokenSymbol, tokenName, tokenDecimal }
        ))
        .reduce( (accum, current) => {
          if (!accum.find(r => (r.contractAddress === current.contractAddress))) { accum.push(current); }
          return accum;
        }, []);
      return r;
    };
    return {
      isConnected,
      getTokenContracts
    }
  }

  const isEtherscanRunning = async ({ config }) => {
    const client = getEtherscanClient(config);
    return client.isConnected();
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
