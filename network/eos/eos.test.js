const should = require('chai').should();
const bip39 = require('bip39');
const Eos = require('eosjs');
const eosModule = require('./eos');
const networkConfig = { 
  value: 'EOS', name: 'EOS', testnet: true, rpcRoot: 'http://localhost:8888' 
};

const httpEndpointFromConfig = (config) => {
  if (config.rpcRoot) {
    return config.rpcRoot;
  }
  return 'http://localhost:8888';
};

const isNetworkRunning = async ({ config }) => {
  try {
    const httpEndpoint = httpEndpointFromConfig(config);
    const eos = Eos({ httpEndpoint, verbose: false, debug: false, logger: {log: null, error: null} });
    const info = await eos.getInfo({});
    // console.log('INFO=', info);
    return !!info.chain_id && !!info.head_block_num;
  } catch (e) {
    if (e.code == 'ECONNREFUSED') return false;
    console.log(e);
    throw e;
  }
};

const walletPublicConfig = {
  networkConfig,
  publicKey: '5JPoydBMicsSBbDHqWA2Z6Qwqxdp8zunXKAyajR1MtSqYesE5Ln'
};

const walletPrivateConfig = {
  networkConfig,
  publicKey: 'EOS5CCcQXjv4TFh5feie7ZVQtAfBEFMhyWgSKCQFCfWsJ1FdRKiRp',
  privateKey: '5JPoydBMicsSBbDHqWA2Z6Qwqxdp8zunXKAyajR1MtSqYesE5Ln'
};

describe("EOS network", () => {

  let isTestAvailable = null;
  beforeEach(async function() {
    const title = this.currentTest.title;
    if (title !== 'Add to HD wallet' && title !== 'Create Random Wallet') {
       if (isTestAvailable === null) isTestAvailable = await isNetworkRunning({ config: networkConfig });
       if (!isTestAvailable) { this.skip(); }
    }
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
    const seed = bip39.mnemonicToSeed(mnemonic);
    const index = 2;

    const res = await eosModule.create({ seed, index, networkConfig });
    // checking valid results
    res.should.be.a('object');
    res.should.have.property('path');
    res.should.have.property('address');
    res.should.have.property('privateKey');
    res.should.have.property('publicKey');
  });

  it('Get assets by public key', async () => {
    // const res = eosModule.getAssets({ walletPublicConfig });
    // console.log("getting assets");
  });
  
});