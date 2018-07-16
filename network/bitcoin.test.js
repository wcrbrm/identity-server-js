const should = require('chai').should();
const bip39 = require('bip39');
const bip32 = require('bip32');
const bitcoin = require('./../network/bitcoin');
const bitcoinJs = require('bitcoinjs-lib');
const networkConfig = require('./../config/networkConfig.mock').BTC;

console.log(networkConfig);

const walletPublicConfig = {
  networkConfig,
  publicKey: '1Z102012031203102301230120301'
};

const walletPrivateConfig = {
  networkConfig,
  publicKey: '1Z123123231231231231231231231',
  privateKey: '5127637612368128371782371239382a37389939330'
};


describe("Bitcoin functions test", () => {
  it('Create wallet', () => {
    //const mnemonic = bip39.generateMnemonic();
    const mnemonic = 'urban twice tomorrow bicycle build web text budget inside exhaust intact snap';
    const seed = bip39.mnemonicToSeed(mnemonic);
    const index = 0;

    const res = bitcoin.create({ seed, index, networkConfig });

    const keyPair = bitcoinJs.ECPair.fromWIF(res.privateKey, bitcoinJs.networks.bitcoin);
    res.should.be.a('object');
    res.should.have.property('privateKey');
    res.should.have.property('publicKey');
    res.privateKey.should.equal(keyPair.toWIF());
    res.publicKey.should.equal(keyPair.getPublicKeyBuffer().toString('hex'));
    done();
  });

  it('Get assets by public key', () => {
    const res = bitcoin.getAssets({ walletPublicConfig });
  });
});