require('chai').should();

const network = 'ETH';
const modEthereum = require('./eth')({ network });
const networkConfig = {
  value: network, name: 'Ethereum', testnet: true, rpcRoot: 'http://127.0.0.1:8545',
  api: 'http://127.0.0.1:9911'
};
const ethNetwork = require('./ethereum-networkhelper')({ network });
const { getWeb3Client, isNetworkRunning, isEtherscanRunning } = ethNetwork;
const Genesis = require('./ethereum-genesis')({ network });

const sleep = ms => (new Promise(resolve => { setTimeout(resolve, ms); }));

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
    const withEtherscan = ['Get Assets Balance', 'Send Assets'];

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
    const res = await modEthereum.getBalance({ walletPublicConfig });
    res.length.should.equal(1);
    res[0].symbol.should.equal('ETH');
    res[0].name.should.equal('Ethereum');
    res[0].value.should.equal('0.01');
  });

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

  it('Invalid Address Validation', async () => {
    const address = 'e17ED9eD45fFAeAbf01970f7C05Ca1bcD15Fd241';
    const res = modEthereum.isValidAddress({ address });
    res.should.be.a('object');
    res.valid.should.equal(false);
    res.error.should.be.a('string');
  });

  it('Valid Primary Key Validation', async () => {
    const validPk = '57313bbe4a12900498ad234381289134698573d7003ec33843dd580bb9158b3c';
    const invalidPk = '0x57313bbe4a12900498ad234381289134698573d7003ec33843dd580bb9158b3c';
    const res = modEthereum.isValidPrimaryKey({ primaryKey: validPk });
    res.should.be.a('object');
    res.valid.should.equal(true);
  });

  it('Invalid Primary Key Validation', async () => {
    const invalidPk = '0x57313bbe4a12900498ad234381289134698573d7003ec33843dd580bb9158b3c';
    const res = modEthereum.isValidPrimaryKey({ primaryKey: invalidPk });
    res.should.be.a('object');
    res.valid.should.equal(false);
    res.error.should.be.a('string');
  });

  const createMyTokenContract = async ({ web3 }) => {
    const fs = require('fs');
    const jsonPath = __dirname + "/MyToken.json";
    const json = JSON.parse(fs.readFileSync(jsonPath));
    const { contractName, abi, bytecode } = json;
    const contractAddress = await Genesis.createTokenContract({ web3, contractName, abi, bytecode });
    return { contractAddress, abi };
  }

  // skipping this - as it is usually very slow
  it.skip('Get Assets Balance', async () => {
    const web3 = getWeb3Client(networkConfig);
    const { contractAddress, abi } = await createMyTokenContract({ web3 });
    const { address } = Genesis.createRandomAccount({ web3 });
    const receipt = await Genesis.creditTokens({ web3, contractAddress, abi, to: address, tokens: 3000000 });
    receipt.should.be.a('object');
    receipt.transactionHash.should.be.a('string');
    receipt.logs.should.be.a('array');
    receipt.status.should.equal('0x1');

    // let is record and be saved in etherscan
    await sleep(3000);

    // console.log(receipt);
    const walletPublicConfig = { networkConfig, address };
    const res = await modEthereum.getAssetsList({ walletPublicConfig });

    // console.log('getting assets list', res);
    const myToken = res.filter(asset => (asset.symbol === 'MY'));
    myToken.length.should.equal(1, 'MY-token records');
  });

  it('Send ETH', async () => {
    const web3 = getWeb3Client(networkConfig);
    const amount = 0.7e18;
    const gasFee = 0.05e18;

    // create random (src)  account#1 (address + privateKey), credit it.
    const { address, privateKey } = await modEthereum.createRandom({ networkConfig });
    const walletPrivateConfig = { networkConfig, address, privateKey };
    Genesis.creditAccount({ web3, address, value: amount + gasFee });
    const balanceOfSender = await modEthereum.getBalance({ walletPublicConfig: walletPrivateConfig });
    // console.log('credited address=', address, ', balanceOfSender=', balanceOfSender);
    balanceOfSender[0].should.be.a('object');
    balanceOfSender[0].symbol.should.equal('ETH');
    balanceOfSender[0].value.should.equal('0.75');

    // create random (dest) account#2 (address)
    const dest = await modEthereum.createRandom({ networkConfig });
    // use modEthereum.sendTransaction to send the funds
    // const res = await modEthereum.sendTransaction({ asset: 'ETH', to: dest.address, amount, walletPrivateConfig });
    // const balanceOfDestination = await modEthereum.getBalance({ walletPublicConfig: { networkConfig, address: dest.address } });
  });

  it.skip('Send Assets', async () => {
  });

  it.skip('Get Transaction History', async () => {
  });
  it.skip('Get Pending Transaction', async () => {
  });

});
