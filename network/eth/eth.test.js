const should = require('chai').should();
const network = 'ETH';
const modEthereum = require('./eth')({ network });
const networkConfig = { value: network, name: 'Ethereum', testnet: true, rpcRoot: 'http://127.0.0.1:8545' };
const ethNetwork = require('./ethereum-networkhelper')({ network });
const { getWeb3Client, isNetworkRunning, isEtherscanRunning } = ethNetwork;
const Genesis = require('./ethereum-genesis')({ network });

describe("Ethereum network", () => {

  let isTestAvailable = null;
  let isEtherscanAvailable = null;

  beforeEach(async function() {
    const title = this.currentTest.title;
    let skipped = false;

    // tests that doesn't need network to be running
    const notInNetwork = [
      'Add to HD wallet', 'Create Random Wallet',
      'Address Validation (Checksum)', 'Address Validation'
    ];
    // tests that need etherscan api to be available too
    const withEtherscan = ['_Get Assets Balance', 'Send Assets'];

    if (notInNetwork.indexOf(title) === -1) {
      if (isTestAvailable === null) isTestAvailable = await isNetworkRunning({ config: networkConfig });
      if (!isTestAvailable) { this.skip(); skipped = true; }
    }
    if (!skipped && withEtherscan.indexOf(title) !== -1) {
      if (isEtherscanAvailable === null) isEtherscanAvailable = await isEtherscanRunning({ config: networkConfig });
      if (!isEtherscanAvailable) { this.skip(); skipped = true; }
    }
  });

  it('Add to HD wallet', async () => {
    const bip39 = require('bip39');
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

  it('Get ETH Balance', async () => {
    const web3 = getWeb3Client(networkConfig);
    const { address } = Genesis.createRandomAccount({ web3 });
    // console.log('crediting address', address);
    const tx = await Genesis.creditAccount({ web3, address, value: 10000000000000000 });
    // console.log("result tx=", tx);
    const walletPublicConfig = { networkConfig, address };
    const res = await modEthereum.getAssets({ walletPublicConfig });
    res.length.should.equal(1);
    res[0].name.should.equal('ETH');
    res[0].value.should.equal('0.01');
  });

  it.skip('Send ETH', async () => {});

  it('Address Validation (Checksum)', async () => {
    const address = '0x939c4eb44c9ffd7f63c108ecd93013e02d23bb26';
    const res = modEthereum.isValidAddress({ address });
    res.should.be.a('object');
    res.valid.should.equal(true);
    res.checksum.should.equal(false);
  });

  it('Address Validation', async () => {
    const address = '0xe17ED9eD45fFAeAbf01970f7C05Ca1bcD15Fd241';
    const res = modEthereum.isValidAddress({ address });
    res.should.be.a('object');
    res.valid.should.equal(true);
    res.checksum.should.equal(true);
  });

  it('Get Assets Balance', async () => {
    const web3 = getWeb3Client(networkConfig);

    const fs = require('fs');
    const jsonPath = __dirname + "/MyToken.json";
    const json = JSON.parse(fs.readFileSync(jsonPath));
    const { contractName, abi, bytecode } = json;
    const contractAddress = await Genesis.createTokenContract({ web3, contractName, abi, bytecode });
    // console.log("contract", contractName, ", address=", contractAddress);
    const { address } = Genesis.createRandomAccount({ web3 });
    const receipt = await Genesis.creditTokens({ web3, contractAddress, abi, to: address, tokens: 3000000 });

    console.log(receipt);

    // const walletPublicConfig = { networkConfig, address };
    // const res = await modEthereum.getAssets({ walletPublicConfig });
    // console.log(res);
    // res.length.should.equal(1);
  });

  it.skip('Send Assets', async () => {});
  it.skip('Get Transaction History', async () => {});
  it.skip('Get Pending Transaction', async () => {});

});
