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
    const withApiKey = (url)=> url; // should be detailed for production, based on config

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
      // return token contracts that inter
      // { contractAddress, tokenSymbol, tokenName, tokenDecimal }
      // &to=${address}
      const url = withApiKey(`${rootUrl}/api?module=account&action=tokentx&startblock=0&endblock=99999999&limit=10000`);
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
