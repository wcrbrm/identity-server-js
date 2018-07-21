const should = require('chai').should();
const bip39 = require('bip39');
const bip32 = require('bip32');
const bitcoin = require('./../network/bitcoin');
const bitcoinJs = require('bitcoinjs-lib');
const networkConfig = require('./../config/networkConfig.mock').BTC;
const btc = require('./btcQuery');
const utils = require('./bitcoin.utils');

const walletPublicConfig = {
  networkConfig,
  // publicKey: '031f446b3142bc7d8fce1f592b5eaa17dcb4c201dbd7fbd311be4efd7184873374' //mainnet
  publicKey: '02cf52dfc4a7ed9b44239f26bb2c8b09421d76e568a15042d184f4a2b5da4e82d7' //testnet
};

const walletPrivateConfig = {
  networkConfig,
  publicKey: '1Z123123231231231231231231231',
  privateKey: '5127637612368128371782371239382a37389939330'
};



describe("Bitcoin functions test", async (d) => {

  beforeEach(async function() {
    const title = this.currentTest.title;
    if (title !== 'Create wallet') {
       const isRegTestAvailable = await btc.isRegTestRunning();
       if (!isRegTestAvailable) { this.skip(); }
    }
  });

  it('Create wallet', () => {
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
    // TODO: where is comparison of the result?
  });
 
//   console.log('isAvailable=', isAvailable);
  it('Get assets by public key', async () => {
    const { publicKey, networkConfig } = walletPublicConfig;
    // Import public key into current wallet
    await btc.query({ method: 'importpubkey', params: [publicKey], config: networkConfig });
    // Make sure, address has 0 balance
    const initBalance = await bitcoin.getAssets({ walletPublicConfig });
    // Send sertain amount of funds to this address
    const address = await utils.getAddressFromPubKey({ walletPublicConfig });
    const amount = 123;
    await btc.query({ method: 'sendtoaddress', params: [ address, amount ], config: networkConfig });
    // If we are in regtest mode, generate new blocks
    await btc.query({ method: 'generate', params: [ 6 ], config: networkConfig });
    // Compare results
    const balance = await bitcoin.getAssets({ walletPublicConfig });
    //console.log(amount, address, initBalance, balance);
    balance.value.should.equal(initBalance.value + amount);
  });

  it('Send transaction', () => {
    const res = bitcoin.sendTransaction({});
  });
});