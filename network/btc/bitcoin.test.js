const should = require('chai').should();
const bip39 = require('bip39');
const bip32 = require('bip32');
const bitcoin = require('./bitcoin');
const bitcoinJs = require('bitcoinjs-lib');
const networkConfig = require('./../../config/networkConfig.mock').BTC;
const btc = require('./bitcoin-query');
const utils = require('./bitcoin-utils');

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

  let isRegTestAvailable = null;
  beforeEach(async function() {
    const title = this.currentTest.title;
    if (title !== 'Add to HD wallet' && title !== 'Create Random Wallet') {
       if (isRegTestAvailable === null) isRegTestAvailable = await btc.isRegTestRunning();
       if (!isRegTestAvailable) { this.skip(); }
    }
  });

  // it('Create Random Wallet', () => {
  ///  const res = bitcoin.createRandom({ networkConfig });
  // });

  it('Add to HD wallet', () => {
    const mnemonic = 'urban twice tomorrow bicycle build web text budget inside exhaust intact snap';
    const seed = bip39.mnemonicToSeed(mnemonic);
    const index = 0;

    const res = bitcoin.create({ seed, index, networkConfig });
    // checking valid results
    res.should.be.a('object');
    res.should.have.property('privateKey');
    res.should.have.property('publicKey');

    // checking whether pairs match
    // WARNING: 1) it uses production mainnet (bitcoinJs.networks.bitcoin) instead of looking at networkConfig
    // TODO: 2) compare result private key and public key with a real value from ian coleman tool
    const keyPair = bitcoinJs.ECPair.fromWIF(res.privateKey, bitcoinJs.networks.bitcoin);
    res.privateKey.should.equal(keyPair.toWIF());
    res.publicKey.should.equal(keyPair.getPublicKeyBuffer().toString('hex'));
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
     // send, balance
  });

});
