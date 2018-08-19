const should = require('chai').should();
const bip39 = require('bip39');
const bip32 = require('bip32');
const bitcoinJs = require('bitcoinjs-lib');
const ElectrumClient = require('electrum-client');
const bitcoin = require('./btc')({ network: 'BTC' });
const networkConfig = require('./../../config/networkConfig.mock').BTC;
const btc = require('./bitcoin-query');
const utils = require('./bitcoin-utils');

const sleep = ms => (new Promise(resolve => { setTimeout(resolve, ms); }));

const walletPublicConfig = {
  networkConfig,
  // publicKey: '031f446b3142bc7d8fce1f592b5eaa17dcb4c201dbd7fbd311be4efd7184873374' //mainnet
  //publicKey: '02cf52dfc4a7ed9b44239f26bb2c8b09421d76e568a15042d184f4a2b5da4e82d7' //testnet
  address: 'mzEJsQ2bPUSDb3VH9KWDiuR9DBmNHvZdS5',
  publicKey: '03eb7ca0882e737299e48c54e86d01db887a7cb2f572c68ac70cb778547d5912f3' //testnet
};

const walletPrivateConfig = {
  address: 'mzEJsQ2bPUSDb3VH9KWDiuR9DBmNHvZdS5',
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
    if (['Add to HD wallet', 'Create Random Wallet'].indexOf(title) === -1) {
       if (isRegTestAvailable === null) isRegTestAvailable = await btc.isRegTestRunning({ config: networkConfig });
       if (!isRegTestAvailable) { this.skip(); }

       if (isElectrumAvailable === null) isElectrumAvailable = await btc.isElectrumRunning({ config: btc.getApiConf(networkConfig.api) });
       if (!isElectrumAvailable) { this.skip(); }
    }
  });

  it('Add to HD wallet', () => {
    const mnemonic = 'stock script strategy banner space siege picture miss million bench render fun demise wheel pulse page paddle tower fine puppy sword acoustic grit october';
    const seed = bip39.mnemonicToSeed(mnemonic).toString('hex');
    const index = 2;

    const res = bitcoin.create({ seed, index, networkConfig });
    //console.log(res);
    // checking valid results
    res.should.be.a('object');
    res.should.have.property('path');
    res.should.have.property('address');
    res.should.have.property('privateKey');
    res.should.have.property('publicKey');

    // checking whether pairs match
    // WARNING: 1) it uses production mainnet (bitcoinJs.networks.bitcoin) instead of looking at networkConfig
    //const network = utils.getNetwork({ networkConfig });
    const network = bitcoinJs.networks.testnet;
    const keyPair = bitcoinJs.ECPair.fromWIF(res.privateKey, network);
    res.privateKey.should.equal(keyPair.toWIF());
    res.publicKey.should.equal(keyPair.getPublicKeyBuffer().toString('hex'));

    // There should be match!!!
    res.address.should.equal('mzEJsQ2bPUSDb3VH9KWDiuR9DBmNHvZdS5');
    res.publicKey.should.equal('03eb7ca0882e737299e48c54e86d01db887a7cb2f572c68ac70cb778547d5912f3');
    res.privateKey.should.equal('cRKFefAwRJcVBFaAG9bLyScHRW3MtBqqYNjGJkJtB9SXgicoFfyf');
    // res.address.should.equal('18FaaXixF9zW2oguEfGeNDiLikKGuh6Pk9');
    // res.publicKey.should.equal('03000132102428229c3ba4e5e28f29e6ebb468522690f17f4372782d193ff2fe0f');
    // res.privateKey.should.equal('L38Nd33xJffVpkLjDGiqvGqJBt5rW8Qe8xdCYRcSgxoBQBpZGUuG');
  });

  it('Get assets by public key', async () => {
    const address = await btc.query({ method: 'getnewaddress', config: networkConfig });
    walletPublicConfig.address = address;

    const initBalance = await bitcoin.getAssetsList({ walletPublicConfig });
    const amount = 1;
    
    const tx = await btc.query({ method: 'sendtoaddress', params: [ address, amount ], config: networkConfig });
    //console.log(tx);
    await sleep(4000);

    const balance = await bitcoin.getAssetsList({ walletPublicConfig });
    //console.log(address, amount, initBalance, balance);
    balance[0].value.should.equal(utils.parse(initBalance[0].value + amount));
  });

  it('Send transaction', async () => {
    const { address, privateKey, publicKey, networkConfig } = walletPrivateConfig;
    const amount = 2;
    const fee = 0.0001;
    // mzEJsQ2bPUSDb3VH9KWDiuR9DBmNHvZdS5
    const to = 'mhRc2gqzDZa7m8uw1XfkmsLVsKeCMrtT3v'; // #1 of given mnemonic in Testnet mode
    const from = address;
    const change = from;
    // Give money to sender:
    await btc.query({ method: 'sendtoaddress', params: [ from, amount + fee ], config: networkConfig });
    // If we are in regtest mode, generate new blocks
    await btc.query({ method: 'generate', params: [ 6 ], config: networkConfig });
    await sleep(4000);

    const tx = await bitcoin.sendTransaction({ 
      asset: 'BTC', 
      amount,
      fee,
      to,
      change,
      walletPrivateConfig 
    });
    await btc.query({ method: 'generate', params: [ 6 ], config: networkConfig });
    const txDetails = await btc.query({ method: 'gettransaction', params: [tx], config: networkConfig });
    //console.log(txDetails);
    txDetails.amount.should.equal(-(amount));
  });

  it('Get pending transactions by public key', async () => {
    const { address, networkConfig } = walletPublicConfig;

    const pending = await bitcoin.getPending({ walletPublicConfig });
    //console.log(pending);

    // // Make incoming transaction
    const incomingTx = await btc.query({ method: 'sendtoaddress', params: [ address, 2 ], config: networkConfig });
    //console.log(incomingTx);
    await sleep(4000);
    
    const pending2 = await bitcoin.getPending({ walletPublicConfig });
    //console.log(pending2);

    // Make outgoing transaction
    const to = await btc.query({ method: 'getnewaddress', config: networkConfig });
    const outgoingTx = await bitcoin.sendTransaction({ 
      asset: 'BTC', 
      amount: 1,
      fee: 0.0001,
      to,
      change: address,
      walletPrivateConfig 
    });
    await sleep(4000);
    const pending3 = await bitcoin.getPending({ walletPublicConfig });
    //console.log(pending3);
    
    // Check that they are present in mempool
    pending2.map(tx => tx.txid).should.contain(incomingTx);
    pending3.map(tx => tx.txid).should.contain(outgoingTx);
  });

  it('Get history by address', async () => {
    const history = await bitcoin.getHistory({ walletPrivateConfig, start: 10, limit: 3 });
    //console.log(history);
  });

  it('Get Electrum client', async () => {
    const network = 'BTC';
    const ElectrumClient = require('electrum-client');
    const { getElectrumClient } = require('./electrum-client')({ network });
    const config =     {
      "network": "BTC",
      "networkId": "REGTEST",
      "testnet": true,
      "path": "m/44'/0'/0'/0/0",
      "address": "1L77xbeuJmfuvkpL6NiSENaFu6G6kk8V3h",
      "publicKey": "035e9545e716de05d92ce5e3d4817e65d75005882e16bea2280c65a87cb8754b9c",
      "privateKey": "Ky4xvMnEpckwCDZMrt5VQ4RfeS8m6mjNHcutXKWVXhy43M6vxLbT",
      "id": "3181958fb46a5d47e761beaead508334c4664c63",
      "index": 0,
      "name": "My BTC Wallet"
    };
    const electrumClient = await getElectrumClient(config);
    electrumClient.should.be.an.instanceof(ElectrumClient);
  });

});
