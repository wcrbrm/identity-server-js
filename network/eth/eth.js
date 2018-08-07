module.exports = ({ network = 'ETH' }) => {

  const { getWeb3Client, getEtherscanClient } = require('./ethereum-networkhelper')({ network });

  const create = async ({ seed, index, networkConfig }) => {
    return require('./../../services/hdwallet')
      .create({ ...networkConfig, network, seed, index, hex: true });
  };

  const createRandom = async ({ networkConfig }) => {
    const web3 = getWeb3Client(networkConfig);
    const { privateKey, address } = web3.eth.accounts.create();
    if (!privateKey) throw new Error('Private Key was not generated for ETH');
    if (address.indexOf('0x') !== 0) throw new Error('Address should start with 0x');
    return { address, privateKey };
  };

  const isValidAddress = ({ address }) => {
    const prefix = '0x';
    const hasNicePrefix = address.substring(0, prefix.length) === prefix;
    const isCorrectLength = address.length === (40 + prefix.length);
    const valid = hasNicePrefix && isCorrectLength;
    const checksum = valid && require('./../../services/eip55').toChecksumAddress(address) === address;
    const res = { valid, checksum };
    if (!valid) {
      // try to give suggestion
      if (address.length === 40 && !hasNicePrefix) {
        res.error = 'Missing 0x in the beginning?';
      } else if (!isCorrectLength) {
        res.error = 'Too few characters';
      } else if (!address.match(/^0x[0-9A-Fa-f]{40}$/g)) {
        res.error = 'Address should be 40 chars of 0x-hexadecimal';
      }
    }
    return res;
  };

  // primary key is same for all configs
  const isValidPrimaryKey = ({ primaryKey }) => {
    const prefix = '0x';
    const hasZeroXPrefix = primaryKey.substring(0, prefix.length) === prefix;
    const isCorrectLength = primaryKey.length === 64;
    const valid = isCorrectLength && !hasZeroXPrefix;
    const res = { valid };
    if (!valid) {
      // try to give suggestion
      if (primaryKey.length === 66 && hasZeroXPrefix) {
        res.error = 'Primary key should not have 0x in the beginning';
      } else if (!isCorrectLength) {
        res.error = 'Too few characters';
      } else if (!address.match(/^[0-9A-Fa-f]{64}$/g)) {
        res.error = 'Private key should be 64 chars of hexadecimal';
      }
    }
    return res;
  };

  const getEth = ({ web3, address }) => {
    return new Promise((resolve, reject) => {
      web3.eth.getBalance(address, (error, response) => {
        if (error) reject(error);
        resolve(web3.fromWei(response.toNumber(), "ether"));
      });
    });
  };

  const getBalance = async ({ walletPublicConfig }) => {
    const { address, networkConfig } = walletPublicConfig;
    const web3 = getWeb3Client(networkConfig);
    if (!web3.isConnected())
       throw new Error('Cannot connect to the network');
    return [{ symbol: 'ETH', name: 'Ethereum', value: await getEth({ web3, address }) }];
  };

  const getAssetsList = async ({ walletPublicConfig }) => {
    // Getting ETH balance here:
    const { address, networkConfig } = walletPublicConfig;
    const web3 = getWeb3Client(networkConfig);
    if (!web3.isConnected()) {
       throw new Error('Cannot connect to the network');
    }

    const assets = [{ symbol: 'ETH', name: 'Ethereum', value: await getEth({ web3, address }) }];
    const etherscan = getEtherscanClient(networkConfig);
    const contracts = etherscan.getTokenContracts(address);
    if (contracts) {
      console.log('address:' + address + ', contracts: ' + JSON.stringify(contracts));
      contracts.forEach(({ contractAddress, tokenSymbol, tokenName, tokenDecimal }) => {
         assets.push({
           symbol: tokenSymbol, name: tokenName, decimal: tokenDecimal,
           contract: contractAddress
         });
      });
    }
    return assets;
  };

  const getAssetValue = async ({ walletPublicConfig, contractAddress }) => {
  };

  const sendTransaction = ({ asset = 'BTC', amount, to, walletPrivateConfig }) => {
    return '0x000000000000000000000000000000000000';
    // should return transaction hash if succeed. Or throw exception if not
  };

  // get list of pending transactions
  const getPending = ({ walletPublicConfig }) => {
    return [];
  };

  // get list of past transactions. could paging be better?
  const getHistory = ({ walletPrivateConfig, start = 0, limit = 100 }) => {
    return [];
  };

  // get transaction details
  const getTransactionDetails = ({ walletPublicConfig, txHash }) => {
    return {};
  };

  return {
    create,
    isValidAddress,
    isValidPrimaryKey,
    getBalance,       // quick getter what is in the wallet
    getAssetsList,    // full retrieval of assets list
    getAssetValue,   // getting asset value
    sendTransaction,
    getPending,
    getHistory,
    getTransactionDetails
  };

};
