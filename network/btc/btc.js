module.exports = ({ network = 'BTC' }) => {

  const bitcoinJs = require('bitcoinjs-lib');
  const bip32 = require('bip32');
  const bip39 = require('bip39');
  const bs58 = require('bs58');
  const coinConstants = require('bip44-constants');
  const btc = require('./bitcoin-query');
  const utils = require('./bitcoin-utils');
  const base58 = require('./../../services/base58');

  const { getElectrumClient } = require('./electrum-client')({ network });

  const create = ({ seed, index, networkConfig }) => {
    const coinSymbol = networkConfig.testnet ? "" : networkConfig.network;
    return require('./../../services/hdwallet').create({ seed, index, network: coinSymbol });
  };

  const isValidAddress = ({ address, networkConfig }) => {
    // // WARNING: THIS IS DRAFT, TEST COVERAGE IS REQUIRED
    // // sources: https://en.bitcoin.it/wiki/List_of_address_prefixes
    const firstChar = address.substring(0, 1);
    const hasNicePrefix = networkConfig.testnet ? 
      (firstChar === 'm' || firstChar === 'n' || firstChar === '2') : 
      (firstChar === '1' || firstChar === '3');
    const minExpectedLength = networkConfig.testnet ? 34 : 26;
    const maxExpectedLength = firstChar === '2' ? 35 : 34;
    const hasNiceSize = address.length <= maxExpectedLength && address.length >= minExpectedLength;
    const isValidChars = base58.check(address.substring(1));

    const decoded = bs58.decode(address);
    const length = decoded.length;
    const checksum = utils.toHex(decoded.slice(length - 4, length));
    const body = utils.toHex(decoded.slice(0, length - 4));
    const goodChecksum = utils.sha256Checksum(body);
    const isValidChecksum = checksum === goodChecksum;

    const valid = hasNicePrefix && hasNiceSize && isValidChars && isValidChecksum;

    const res = { valid, checksum: isValidChecksum };

    if (!valid) {
      // try to give suggestion
      if (!hasNicePrefix) {
        res.error = networkConfig.testnet 
          ? 'Address should begin with "m", "n" or "2" in Testnet' 
          : 'Address should begin with "1" or "3" in Mainnet';
      } else if (!hasNiceSize && address.length < minExpectedLength) {
        res.error = 'Too few characters';
      } else if (!hasNiceSize && address.length > maxExpectedLength) {
        res.error = 'Too many characters';
      } else if (!isValidChars) {
        res.error = 'Address should be a valid base58 code';
      } else if (!isValidChecksum) {
        res.error = 'Checksum of the Address is invalid';
      }
    }

    return res;
  }

  const getAssetsList = async ({ walletPublicConfig }) => {
    //const address = utils.getAddressFromPubKey({ walletPublicConfig });
    const { address, networkConfig } = walletPublicConfig;
    try {
      const electrumClient = await getElectrumClient(networkConfig);
      const balance = await electrumClient.blockchainAddress_getBalance(address);
      const value = utils.parse(
        utils.parseSatoshi(
          balance 
          && balance.confirmed !== undefined 
          && balance.unconfirmed !== undefined 
          ? balance.confirmed + balance.unconfirmed 
          : 0
        )
      );
      return [{ name: 'BTC', value }];
    } catch (e) {
      throw new Error(e.message);
    }
    return [{ name: 'BTC', value: 0 }];
  };

  const sendTransaction = async ({ asset = 'BTC', amount, fee, to, change, walletPrivateConfig }) => {
    const { address, privateKey, publicKey, networkConfig } = walletPrivateConfig;
    const walletPublicConfig = { address, publicKey, networkConfig };
    
    try {
      const electrumClient = await getElectrumClient(networkConfig);

      const network = utils.getNetwork({ networkConfig });
      const builder = new bitcoinJs.TransactionBuilder(network);
   
      // List transaction of the address
      const from = address;
      const unspent = await electrumClient.blockchainAddress_listunspent(from);
      const toSpend = utils.getTxsToSpend2({ unspent, amount: (amount + fee) });
      
      toSpend.forEach((tx) => builder.addInput(tx.tx_hash, tx.tx_pos));
  
      const sum = toSpend.reduce((sum, tx) => sum + tx.value, 0); // satoshi
      builder.addOutput(to, utils.toSatoshi(amount));
      builder.addOutput(change, (sum - utils.toSatoshi(amount) - utils.toSatoshi(fee)));
  
      // Sign each transaction input
      toSpend.forEach((tx, i) => builder.sign(i, bitcoinJs.ECPair.fromWIF(privateKey, network)));
      
      const transaction = builder.build();
      const tx = transaction.toHex();
  
      const sentTx = await electrumClient.blockchainTransaction_broadcast(tx);
  
      // should return transaction hash if succeed. Or throw exception if not
      return sentTx; 

    } catch (e) {
      throw new Error(e.message);
    }
    return null;
  };

  const getPending = async ({ walletPublicConfig }) => {
    const { address, networkConfig } =  walletPublicConfig;

    try {
      const electrumClient = await getElectrumClient(networkConfig);
      const network = utils.getNetwork({ networkConfig });
      const mempool = await electrumClient.blockchainAddress_getMempool(address);
      //console.log(mempool);
  
      if (mempool && mempool.length > 0) {
        const mempoolTransactions = mempool.map(async (m) => {
          // Transaction id:
          const txid = m.tx_hash;
          return await utils.decodeTransaction({
            txid,
            electrumClient,
            network
          });
        });
        return await Promise.all(mempoolTransactions);
      }
    } catch (e) {
      throw new Error(e.message);
    }
    return [];
  };

  // get list of past transactions. could paging be better?
  const getHistory = async ({ walletPrivateConfig, start = 0, limit = 100 }) => {
    const { address, networkConfig } =  walletPrivateConfig;
    try {
      const electrumClient = await getElectrumClient(networkConfig);
      const network = utils.getNetwork({ networkConfig });
      const history = await electrumClient.blockchainAddress_getHistory(address);
      if (history && history.length > 0) {
        // We cannot limit Electrum query, but we can decode only transaction within limit
        const txsToDecode = history.splice(start, limit);
        const decodedTransactions = txsToDecode.map(async (tx) => {
          const txid = tx.tx_hash;
          return await utils.decodeTransaction({
            txid,
            electrumClient,
            network
          });
        });
        return await Promise.all(decodedTransactions);
      }
    } catch (e) {
      throw new Error(e.message);
    }
    return [];
  };

  // get transaction details
  const getTransactionDetails = ({ walletPublicConfig, txHash }) => {
    return {};
  };


  return {
    isValidAddress,
    create,
    getAssetsList,
    sendTransaction,
    getPending,
    getHistory,
    getTransactionDetails
  };

}
