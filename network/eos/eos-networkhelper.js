module.exports = ({ network = 'EOS' }) => {
  const Eos = require('eosjs');

  const httpEndpointFromConfig = (config) => {
    if (config.rpcRoot) {
        return config.rpcRoot;
    }
    return 'http://localhost:8888';
  };
    
  const isNetworkRunning = async ({ config }) => {
    return false;
    try {
        const httpEndpoint = httpEndpointFromConfig(config);
        const eos = Eos({ httpEndpoint, verbose: false, debug: false, logger: {log: null, error: null} });
        const info = await eos.getInfo({});
        // console.log('INFO=', info);
        return !!info.chain_id && !!info.head_block_num;
    } catch (e) {
        if (e.code == 'ECONNREFUSED') return false;
        console.log(e);
        throw e;
    }
  };

  return {
    httpEndpointFromConfig,
    isNetworkRunning
  };
}