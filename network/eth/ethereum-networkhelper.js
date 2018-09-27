module.exports = ({ network = 'ETH' }) => {
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

  return {
    httpEndpointFromConfig
  };
}
