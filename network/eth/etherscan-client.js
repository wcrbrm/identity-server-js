module.exports = ({ network = 'ETH' }) => {

  const axios = require('axios');
  const debug = require('debug')('etherscan.client');
  const { Networks } = require('./../../config/networks');
  const { apiKeys, testnets } = Networks.filter(f => (f.value === network))[0];

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
    return 'https://api.etherscan.io';
  };

  const withEtherscanApiKey = (url) => {
    if (!apiKeys || apiKeys.length === 0) {
      throw new Error('Etherscan API Keys were not found');
    }
    const randomElement = arr => (arr[Math.floor(Math.random() * arr.length)]);
    const apiKey = randomElement(apiKeys);
    if (!apiKey) {
      throw new Error('API Key could not be chosen for EtherScan');
    }
    debug("api key chosen", apiKey);
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
    };

    const getTokenContracts = async (address) => {
      // return token contracts that was sending any token to that address
      const url = withEtherscanApiKey(`${rootUrl}/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=9999999&sort=desc`);
      debug('requesting', url);
      const response = await axios.get(url);
      const { data } = response;
      const { message, result, status } = data;
      if (parseInt(status, 10) !== 1) {
        debug("error", JSON.stringify(data));
        if (message === 'No transactions found') {
          return [];
        }
        throw new Error('Etherscan response error: ' + result);
      }

      const r = result
        .filter(f => (f.to.toLowerCase() === address.toLowerCase()))
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
      getTokenContracts,
      withEtherscanApiKey
    };
  };

  return  {
    etherscanEndpointFromConfig,
    getEtherscanClient
  };
};
