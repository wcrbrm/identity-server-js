module.exports = ({ network = 'ETH' }) => {
  const { getEtherscanClient } = require('./etherscan-client')({ network });

  const isEtherscanRunning = async ({ config }) => {
    const client = getEtherscanClient(config);
    return client.isConnected();
  };

  return {
    getEtherscanClient,
    isEtherscanRunning
  };
};