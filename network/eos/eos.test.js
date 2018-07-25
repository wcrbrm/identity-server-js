const should = require('chai').should();
const bip39 = require('bip39');
const eosModule = require('./eos');
const networkConfig = {  value: 'EOS', name: 'EOS', testnet: true, rpcRoot: 'http://localhost:8888' };

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

  it('Create Random Wallet', async () => {
    // const mnemonic = 'urban twice tomorrow bicycle build web text budget inside exhaust intact snap';
    // const seed = bip39.mnemonicToSeed(mnemonic);
    const seed = '';
    const index = 0;
    const res = await eosModule.createRandom({ seed, index, networkConfig });
    res.should.have.property('privateKey');
    res.should.have.property('publicKey');
  });

  it('Add to HD wallet', async () => {
    const mnemonic = 'stock script strategy banner space siege picture miss million bench render fun demise wheel pulse page paddle tower fine puppy sword acoustic grit october';
    const seed = bip39.mnemonicToSeed(mnemonic);
    const index = 2;

    const res = await eosModule.create({ seed, index, networkConfig });
    // checking valid results
    res.should.be.a('object');
    res.should.have.property('path');
    res.should.have.property('address');
    res.should.have.property('privateKey');
    res.should.have.property('publicKey');
  });

  // it('Get assets by public key', () => {
  //   const res = eosModule.getAssets({ walletPublicConfig });
  // });
});