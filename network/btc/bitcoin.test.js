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
  publicKey: '0376884f5a9fe3a90cb3deeec73d2bb114dc893a191c10ed4ae68c57b184d5a799',
  privateKey: 'cRaQuDraY4asHwbw2FhxwvQQet3mFwhCMF4j8qNwH7JnYfktT9RB'
}; // #4 of given mnemonic

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
    const mnemonic = 'stock script strategy banner space siege picture miss million bench render fun demise wheel pulse page paddle tower fine puppy sword acoustic grit october';
    const seed = bip39.mnemonicToSeed(mnemonic);
    const index = 2;

    const res = bitcoin.create({ seed, index, networkConfig });
    // checking valid results
    res.should.be.a('object');
    res.should.have.property('path');
    res.should.have.property('address');
    res.should.have.property('privateKey');
    res.should.have.property('publicKey');

    // checking whether pairs match
    // WARNING: 1) it uses production mainnet (bitcoinJs.networks.bitcoin) instead of looking at networkConfig
    const keyPair = bitcoinJs.ECPair.fromWIF(res.privateKey, bitcoinJs.networks.bitcoin);
    res.privateKey.should.equal(keyPair.toWIF());
    res.publicKey.should.equal(keyPair.getPublicKeyBuffer().toString('hex'));

// TODO: there should be match!!!
//     res.address.should.equal('18FaaXixF9zW2oguEfGeNDiLikKGuh6Pk9');
//     res.publicKey.should.equal('03000132102428229c3ba4e5e28f29e6ebb468522690f17f4372782d193ff2fe0f');
//     res.privateKey.should.equal('L38Nd33xJffVpkLjDGiqvGqJBt5rW8Qe8xdCYRcSgxoBQBpZGUuG');
  });
 
//   console.log('isAvailable=', isAvailable);
  it('Get assets by public key', async () => {
    const { publicKey, networkConfig } = walletPublicConfig;
    // Import public key into current wallet, so that we can check the balance, but cannot spend it
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

  it.only('Send transaction', async () => {
    const { privateKey, publicKey, networkConfig } = walletPrivateConfig;
    // Import private key into wallet, so that we could spend assets
    await btc.query({ method: 'importprivkey', params: [privateKey], config: networkConfig });
    const amount = 123;
    const fee = 0.0001;
    const from = utils.getAddressFromPubKey({ walletPublicConfig: { publicKey, networkConfig } });
    const to = 'mo8mao8M1VEgFs4QgyY49bSGX1dta42gbR'; // #1 of given mnemonic
    const change = await btc.query({ method: 'getrawchangeaddress', config: networkConfig });
    // Give money to sender:
    await btc.query({ method: 'sendtoaddress', params: [ from, 1000 ], config: networkConfig });
    // If we are in regtest mode, generate new blocks
    await btc.query({ method: 'generate', params: [ 6 ], config: networkConfig });

    const tx = await bitcoin.sendTransaction({ 
      asset: 'BTC', 
      amount,
      fee,
      to,
      change,
      walletPrivateConfig 
    });
    const txDetails = await btc.query({ method: 'gettransaction', params: [tx], config: networkConfig });
    txDetails.amount.should.equal(-(amount));
  });

});