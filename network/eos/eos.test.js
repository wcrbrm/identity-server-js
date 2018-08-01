require('chai').should();

const network = 'EOS';
const eosModule = require('./eos')({ network });

const networkConfig = {
  value: network, name: network, testnet: true, rpcRoot: 'http://localhost:8888'
};
const Genesis = require('./eos-genesis')({ network });
const { isNetworkRunning } = require('./eos-networkhelper')({ network });

describe("EOS network", () => {

  let isTestAvailable = null;
  beforeEach(async function() {
    const noNetwork = ['Add to HD wallet', 'Create Random Wallet', 'Public from Private'];
    const title = this.currentTest.title;
    // console.log('currentTest', this.currentTest, noNetwork.indexOf(title));
    if (noNetwork.indexOf(title) === -1) {
       if (isTestAvailable === null) isTestAvailable = await isNetworkRunning({ config: networkConfig });
       if (!isTestAvailable) { this.skip(); }
    }
  });

  it.only('Public from Private', () => {
    const { PrivateKey } = require('eosjs-ecc');
    const public = 'EOS5r5VnY2znQv6ANYPNThVCYHmbvePqhJAmfspknuUuigMgCWwMZ';
    const priv1 = PrivateKey.fromString('KzBxdjeous1k93auf2yHaPnW2svH7BGFd8szbQ5o7Yc59Hsx7wr4');
    priv1.toPublic().toString().should.equal(public);

    const hdWallet = require('./../../services/hdwallet');
    priv1.toBuffer().length.should.equal(32);
    hdWallet.eosPublicKey(priv1.toBuffer(), 'EOS').should.equal(public);
    hdWallet.eosPublicKey(priv1.toBuffer(), '').should.equal(public);
  });

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
    const bip39 = require('bip39');
    const seed = bip39.mnemonicToSeed(mnemonic);
    const index = 2;

    const res = await eosModule.create({ seed, index, networkConfig });
    // checking valid results
    res.should.be.a('object');
    res.should.have.property('path');
    res.should.not.have.property('address');
    res.should.have.property('privateKey');
    res.should.have.property('publicKey');
    res.publicKey.substring(0,3).should.equal('EOS');
    res.publicKey.length.should.be.above(4);
  });

  it('Get Balance', async () => {
    const acc = await Genesis.createRandomAccount();
    acc.should.be.a('object');
    acc.should.have.property('accountId');
    acc.should.have.property('privateKey');
    acc.should.have.property('publicKey');
    acc.should.have.property('tx');
    acc.tx.should.have.property('transaction_id');
    acc.accountId.length.should.equal(12);

    // { tx, accountId, publicKey, privateKey }
    // const res = eosModule.getAssets({ walletPublicConfig });
    // console.log("getting assets");
  });

});
