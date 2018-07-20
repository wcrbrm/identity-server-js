const eosModule = require('./../network/eos');
const networkConfig = require('./../config/networkConfig.mock').BTC;

const walletPublicConfig = {
  networkConfig,
  publicKey: '5JPoydBMicsSBbDHqWA2Z6Qwqxdp8zunXKAyajR1MtSqYesE5Ln'
};

const walletPrivateConfig = {
  networkConfig,
  publicKey: 'EOS5CCcQXjv4TFh5feie7ZVQtAfBEFMhyWgSKCQFCfWsJ1FdRKiRp',
  privateKey: '5JPoydBMicsSBbDHqWA2Z6Qwqxdp8zunXKAyajR1MtSqYesE5Ln'
};


describe("EOS network", () => {
  it('Create EOS wallet', async () => {
    // const mnemonic = 'urban twice tomorrow bicycle build web text budget inside exhaust intact snap';
    // const seed = bip39.mnemonicToSeed(mnemonic);
    const seed = '';
    const index = 0;
    const res = await eosModule.create({ seed, index, networkConfig });
    res.should.have.property('privateKey');
    res.should.have.property('publicKey');
  });

  // it('Get assets by public key', () => {
  //   const res = eosModule.getAssets({ walletPublicConfig });
  // });
});