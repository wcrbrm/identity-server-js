const bitcoinJs = require('bitcoinjs-lib');

const getNetwork = ({ networkConfig }) => {
  // Regtest is also a Testnet, no special config needed
  return networkConfig.testnet ? bitcoinJs.networks.testnet : bitcoinJs.networks.bitcoin;
};

const getAddressFromPubKey = ({ walletPublicConfig }) => {
  const { publicKey, networkConfig } = walletPublicConfig;
  const publicKeyBuffer = Buffer.from(publicKey, 'hex');
  return bitcoinJs.ECPair.fromPublicKeyBuffer(publicKeyBuffer, getNetwork({ networkConfig })).getAddress();
};

module.exports = {
  getNetwork,
  getAddressFromPubKey
}
