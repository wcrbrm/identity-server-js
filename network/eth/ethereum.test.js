const should = require('chai').should();
const bip39 = require('bip39');
const modEthereum = require('./ethereum');
const networkConfig = {
  value: 'ETH', name: 'Ethereum', testnet: true, rpcRoot: 'http://127.0.0.1:8545' 
};
const { getWeb3Client, isNetworkRunning } = require('./ethereum-networkhelper');
const { createRandomAccount, creditAccount } = require('./ethereum-genesis');

const walletPublicConfig = {
  networkConfig,
  address: '0x60fAF47e20b92a92Ac13B83374f1adB9cDDFD330'
};

const walletPrivateConfig = {
  networkConfig,
  address: '0xe17ED9eD45fFAeAbf01970f7C05Ca1bcD15Fd241',
  privateKey: '0xbe91a8e265788f2314502f16976eefd64831539503fb11432d91196e1b01267b'
};

describe("Ethereum network", () => {

  let isTestAvailable = null;
  beforeEach(async function() {
    const title = this.currentTest.title;
    if (title !== 'Add to HD wallet' && title !== 'Create Random Wallet') {
       if (isTestAvailable === null) isTestAvailable = await isNetworkRunning({ config: networkConfig });
       if (!isTestAvailable) { this.skip(); }
    }
  });

  it('Add to HD wallet', async () => {
    const mnemonic = 'stock script strategy banner space siege picture miss million bench render fun demise wheel pulse page paddle tower fine puppy sword acoustic grit october';
    // root key: xprv9s21ZrQH143K2eorBS1xakyr8q8cutw1tQfrkdDRAR7KA4zXEZp9SdoJtYozQ4aXpQFovWiPM4driRSN8ppVW3yWX3D7qYV3JCEV95XbE1X
    // extended private key: xprv9ywEWCE3XXtntZuVxHXSnC8pArKFrVZwcH9BavX1HG2FndZFoevggwaCHUfVg6GrkE6vQKg774Y1zN7AxEZ1Xu6kEziKkvgPcLjRv8Roh8P
    // extended public key: xpub6CvauhkwMuT673yy4K4T9L5Yit9kFxHnyW4nPJvcqbZEfRtQMCEwEjtg8kmiTGNuXcAiZ2WV5uFX8s6SN7V1hhmmo5THajfX3tBu2o5zGcx
    const seed = bip39.mnemonicToSeed(mnemonic);
    const index = 0;
    const res = await modEthereum.create({ seed, index, networkConfig });
    res.should.have.property('path');
    res.should.have.property('address');
    res.should.have.property('privateKey');
    // res.path.should.equal("m/44'/60'/0'/0/0");
    res.address.should.equal('0xe17ED9eD45fFAeAbf01970f7C05Ca1bcD15Fd241');
    res.privateKey.should.equal('0xbe91a8e265788f2314502f16976eefd64831539503fb11432d91196e1b01267b');
  });

  it('Get ETH balance', async () => {
    const web3 = getWeb3Client(networkConfig);
    const { address } = createRandomAccount({ web3 });
    // console.log('crediting address', address);
    const tx = await creditAccount({ web3, address, value: 10000000000000000 });
    // console.log("result tx=", tx);
    const walletPublicConfig = { networkConfig, address };
    const res = await modEthereum.getAssets({ walletPublicConfig });
    res.length.should.equal(1);
    res[0].name.should.equal('ETH');
    res[0].value.should.equal('0.01');
  });
});