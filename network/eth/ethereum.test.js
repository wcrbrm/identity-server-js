const should = require('chai').should();
const bip39 = require('bip39');
const modEthereum = require('./ethereum');
const networkConfig = {  value: 'ETH', name: 'Ethereum', testnet: true, rpcRoot: 'http://localhost:8545' };

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
  it('Add to HD-wallet', async () => {
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

  // it('Get assets by public key', () => {
  //   const res = eosModule.getAssets({ walletPublicConfig });
  // });
});