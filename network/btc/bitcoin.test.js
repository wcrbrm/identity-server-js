const should = require('chai').should();
const bip39 = require('bip39');
const bip32 = require('bip32');
const bitcoinJs = require('bitcoinjs-lib');
const ElectrumClient = require('electrum-client');
const bitcoin = require('./bitcoin');
const networkConfig = require('./../../config/networkConfig.mock').BTC;
const btc = require('./bitcoin-query');
const utils = require('./bitcoin-utils');

const walletPublicConfig = {
  networkConfig,
  // publicKey: '031f446b3142bc7d8fce1f592b5eaa17dcb4c201dbd7fbd311be4efd7184873374' //mainnet
  //publicKey: '02cf52dfc4a7ed9b44239f26bb2c8b09421d76e568a15042d184f4a2b5da4e82d7' //testnet
  publicKey: '03eb7ca0882e737299e48c54e86d01db887a7cb2f572c68ac70cb778547d5912f3' //testnet
};

const walletPrivateConfig = {
  networkConfig,
  //publicKey: '0376884f5a9fe3a90cb3deeec73d2bb114dc893a191c10ed4ae68c57b184d5a799',
  //privateKey: 'cRaQuDraY4asHwbw2FhxwvQQet3mFwhCMF4j8qNwH7JnYfktT9RB'
  publicKey: '03eb7ca0882e737299e48c54e86d01db887a7cb2f572c68ac70cb778547d5912f3',
  privateKey: 'cRKFefAwRJcVBFaAG9bLyScHRW3MtBqqYNjGJkJtB9SXgicoFfyf'
}; // #4 of given mnemonic

describe("Bitcoin functions test", async (d) => {

  let isRegTestAvailable = null;
  let isElectrumAvailable = null;
  beforeEach(async function() {
    const title = this.currentTest.title;
    if (title !== 'Add to HD wallet' && title !== 'Create Random Wallet') {
       if (isRegTestAvailable === null) isRegTestAvailable = await btc.isRegTestRunning({ config: networkConfig });
       if (!isRegTestAvailable) { this.skip(); }

       if (isElectrumAvailable === null) isElectrumAvailable = await btc.isElectrumRunning({ config: networkConfig.electrum });
       if (!isElectrumAvailable) { this.skip(); }
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

    // There should be match!!!
    res.address.should.equal('18FaaXixF9zW2oguEfGeNDiLikKGuh6Pk9');
    res.publicKey.should.equal('03000132102428229c3ba4e5e28f29e6ebb468522690f17f4372782d193ff2fe0f');
    res.privateKey.should.equal('L38Nd33xJffVpkLjDGiqvGqJBt5rW8Qe8xdCYRcSgxoBQBpZGUuG');
  });
 
//   console.log('isAvailable=', isAvailable);
  // it('Get assets by public key', async () => {
  //   const { publicKey, networkConfig } = walletPublicConfig;
  //   // Import public key into current wallet, so that we can check the balance, but cannot spend it
  //   await btc.query({ method: 'importpubkey', params: [publicKey], config: networkConfig });
  //   // Make sure, address has 0 balance
  //   const initBalance = await bitcoin.getAssets({ walletPublicConfig });
  //   // Send sertain amount of funds to this address
  //   const address = await utils.getAddressFromPubKey({ walletPublicConfig });
  //   const amount = 123;
  //   await btc.query({ method: 'sendtoaddress', params: [ address, amount ], config: networkConfig });
  //   // If we are in regtest mode, generate new blocks
  //   await btc.query({ method: 'generate', params: [ 6 ], config: networkConfig });
  //   // Compare results
  //   const balance = await bitcoin.getAssets({ walletPublicConfig });
  //   //console.log(amount, address, initBalance, balance);
  //   balance.value.should.equal(initBalance.value + amount);
  // });

  it('Get assets by public key', async () => {
    const initBalance = await bitcoin.getAssets({ walletPublicConfig });
    const address = await utils.getAddressFromPubKey({ walletPublicConfig });
    const amount = 0.123;
    
    // Wait for electrum update:
    const sendToAddress = () => {
      return new Promise(async (resolve, reject) => {
        const { host, port, protocol } = walletPublicConfig.networkConfig.electrum;
        const ecl = new ElectrumClient(port, host, protocol);
        await ecl.connect();
        ecl.subscribe.on('blockchain.address.subscribe', (e) => {
          resolve(true);
        });
        await ecl.blockchainAddress_subscribe(address);
        await btc.query({ method: 'sendtoaddress', params: [ address, amount ], config: networkConfig });
      });
    };

    const sent = await sendToAddress();
    if (sent) {
      const balance = await bitcoin.getAssets({ walletPublicConfig });
      //console.log(amount, address, initBalance, balance, utils.parse(initBalance.value + amount));
      balance.value.should.equal(utils.parse(initBalance.value + amount));
    }
  });

  it('Send transaction', async () => {
    const { privateKey, publicKey, networkConfig } = walletPrivateConfig;
    // Import private key into wallet, so that we could spend assets
    await btc.query({ method: 'importprivkey', params: [privateKey], config: networkConfig });
    const amount = 123;
    const fee = 0.0001;
    // mzEJsQ2bPUSDb3VH9KWDiuR9DBmNHvZdS5
    const from = utils.getAddressFromPubKey({ walletPublicConfig: { publicKey, networkConfig } });
    const to = 'mhRc2gqzDZa7m8uw1XfkmsLVsKeCMrtT3v'; // #1 of given mnemonic in Testnet mode
    const change = await btc.query({ method: 'getrawchangeaddress', config: networkConfig });
    // Give money to sender:
    await btc.query({ method: 'sendtoaddress', params: [ from, amount + fee ], config: networkConfig });
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

  it('Get pending transactions by public key', async () => {
    const pending = await bitcoin.getPending({ walletPublicConfig });
    console.log(pending);
    // Make incoming and outgoing transaction
    // Check that they are present in mempool
    // Check sender, receiver and amount
    // Make confirmation and make sure transactions disappeared
    //console.log(res);
  });

});
