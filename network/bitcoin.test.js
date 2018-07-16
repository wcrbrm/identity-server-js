const should = require('chai').should();
const bip39 = require('bip39');
const bip32 = require('bip32');
const bitcoin = require('./../network/bitcoin');
const bitcoinJs = require('bitcoinjs-lib');
const networkConfig = require('./../config/config').networkConfig;

describe("Bitcoin functions test", () => {
  it.only('Create wallet', (done) => {
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

  it('Get assets by public key', (done) => {
    const res = bitcoin.getAssets({ walletPublicConfig: {
      networkConfig,
      publicKey: '031f446b3142bc7d8fce1f592b5eaa17dcb4c201dbd7fbd311be4efd7184873374'
    } });
    done();
  });
});