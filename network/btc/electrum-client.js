module.exports = ({ network = 'BTC' }) => {

  const ElectrumClient = require('electrum-client');
  const { Networks } = require('./../../config/networks');
  const { testnets } = Networks.filter(f => (f.value === network))[0];
  const { isRegTestRunning, isElectrumRunning, getApiConf } = require('./bitcoin-query'); 

  const getElectrumClient = async (config) => {
    if (config.testnet) {
      if (config.networkId) {
        if (config.networkId === 'REGTEST') {
          const regtestConfig = testnets.find(f => f.networkId === config.networkId);
          if (!regtestConfig) throw new Error('Bitcoin Regtest mode is not configured');
          if (!regtestConfig.rpc) throw new Error('Bitcoin Regtest RPC is not defined');
          if (!regtestConfig.api) throw new Error('Bitcoin Regtest Electrum API is not defined');

          // Check if Bitcoind is running
          const isRegTestAvailable = await isRegTestRunning({ config: regtestConfig });
          if (!isRegTestAvailable) throw new Error('Bitcoin Regtest is not running');

          // Get instance of connected Electrum client
          const electrumClient = await getElectrumConnection([regtestConfig.api]);
          if (!electrumClient) throw new Error('ElectrumX server not running');

          return electrumClient;

        } else if (config.networkId === 'TESTNET') {
          const testnetConfig = testnets.find(f => f.networkId === config.networkId);
          if (!testnetConfig.api || !Array.isArray(testnetConfig.api) || testnetConfig.api.length === 0 ) {
            throw new Error('Bitcoin Testnet Electrum API is not defined');
          }
          const electrumClient = getElectrumConnection(testnetConfig.api);
          if (!electrumClient) throw new Error('ElectrumX server not running');

          return electrumClient;
        }
      } else {
        // user provided settings 
      } 
    }
    // try to connect to mainnet servers
  };

  const getElectrumConnection = async (urls) => {
    for (let i = 0; i < urls.length; i++) {
      const { host, port, protocol } = getApiConf(urls[i]);
      const isElectrumAvailable = await isElectrumRunning({ config: { host, port, protocol } });
      if (isElectrumAvailable) {
        const electrumClient = new ElectrumClient(port, host, protocol);
        await electrumClient.connect();
        return electrumClient;
      }
    }
    return false;
  };

  return {
    getElectrumClient
  };
};