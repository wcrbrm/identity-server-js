module.exports = ({ network = 'BTC' }) => {

  const bitcoinJs = require('bitcoinjs-lib');
  const bip32 = require('bip32');
  const bip39 = require('bip39');
  const bip38 = require('bip38');
  const wif = require('wif');
  const btc = require('./bitcoin-query');
  const utils = require('./bitcoin-utils');
  const base58 = require('./../../services/base58');
  const { getTicker } = require('./../../services/coinmarketcap');

  const { getElectrumClient } = require('./electrum-client')({ network });

  const niceFloat = x => (parseFloat(x).toFixed(6).replace(/0{1,5}$/, ''));

  const create = ({ seed, index, networkConfig }) => {
    const coinSymbol = networkConfig.testnet ? "" : networkConfig.network;
    return require('./../../services/hdwallet').create({ seed, index, network: coinSymbol });
  };

  const addressFromPrivateKey = ({ privateKey, networkConfig }) => {
    const network = utils.getNetwork({ networkConfig });
    return bitcoinJs.ECPair.fromWIF(privateKey, network).getAddress();
  };

  const decryptPrivateKey = ({ key, password, networkConfig }) => {
    if (password) {
      const decrypted = bip38.decrypt(key, password);
      const network = utils.getNetwork({ networkConfig });
      return wif.encode(network.wif, decrypted.privateKey, true); // compressed?
    }
    return key;
  };

  const encryptPrivateKey = ({ key, password, networkConfig }) => {
    if (password) {
      const network = utils.getNetwork({ networkConfig });
      const privateKeyBuffer = wif.decode(key, network.wif, false);
      return bip38.encrypt(privateKeyBuffer.privateKey, false, password);
    }
    return key;
  };

  const isValidAddress = ({ address, networkConfig }) => {
    // sources: https://en.bitcoin.it/wiki/List_of_address_prefixes
    const firstChar = address.substring(0, 1);
    const hasNicePrefix = networkConfig.testnet ?
      (firstChar === 'm' || firstChar === 'n' || firstChar === '2') :
      (firstChar === '1' || firstChar === '3');
    const minExpectedLength = networkConfig.testnet ? 34 : 26;
    const maxExpectedLength = firstChar === '2' ? 35 : 34;
    const hasNiceSize = address.length <= maxExpectedLength && address.length >= minExpectedLength;
    const isValidChars = base58.check(address.substring(1));

    const checksum = utils.validateChecksum(address);

    const valid = hasNicePrefix && hasNiceSize && isValidChars && checksum;

    const res = { valid, checksum };

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
      } else if (!checksum) {
        res.error = 'Checksum of the Address is invalid';
      }
    }

    return res;
  };

  const isValidPrivateKey = ({ privateKey, password, networkConfig }) => {
    privateKey = decryptPrivateKey({ key: privateKey, password, networkConfig });
    const firstChar = privateKey.substring(0, 1);
    const hasNicePrefix = networkConfig.testnet
                          ? firstChar === '9' || firstChar === 'c'
                          : firstChar === '5' || firstChar === 'K' || firstChar === 'L';
    const hasNiceSize = (firstChar === '9' || firstChar === '5') && privateKey.length === 51
                        || (
                          (firstChar === 'c' || firstChar === 'K' || firstChar === 'L')
                          && privateKey.length === 52
                        );

    const checksum = utils.validateChecksum(privateKey);

    const valid = hasNicePrefix && hasNiceSize && checksum;
    const res = { valid, checksum, privateKey };
    if (!valid) {
      if (!hasNicePrefix) {
        res.error = networkConfig.testnet ?
          'Private key should begin with "9" or "c" in Testnet'
          : 'Private key should begin with "5", "K", "L" in Mainnet';
      } else if (!hasNiceSize && privateKey.length < 52) {
        res.error = 'Too few characters';
      } else if (!hasNiceSize && privateKey.length > 52) {
        res.error = 'Too many characters';
      } else if (!checksum) {
        res.error = 'Checksum of a Private Key is invalid';
      }
    }
    res.address = addressFromPrivateKey({ privateKey, networkConfig });
    return res;
  };

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
      await electrumClient.close();

      return [{ symbol: 'BTC', name: 'Bitcoin', value: niceFloat(value), cmc: getTicker('BTC')  }];
    } catch (e) {
      throw new Error(e.message);
    }
    return [{ symbol: 'BTC', name: 'Bitcoin', value: 0 }];
  };

  const sendTransaction = async ({ asset = 'BTC', amount, fee, to, change, walletPrivateConfig }) => {
    const { address, privateKey, publicKey, networkConfig } = walletPrivateConfig;
    const walletPublicConfig = { address, publicKey, networkConfig };
    amount = utils.parse(amount);
    change = change || address;
    
    try {
      const electrumClient = await getElectrumClient(networkConfig);

      const network = utils.getNetwork({ networkConfig });
      const builder = new bitcoinJs.TransactionBuilder(network);

      // List transaction of the address
      const from = address;
      fee = fee ? utils.parse(fee) : await electrumClient.blockchainEstimatefee(6); // 6 blocks waiting
      
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

      await electrumClient.close();
      // should return transaction hash if succeed. Or throw exception if not
      return {
        txid: sentTx,
        from: address,
        to,
        change,
        amount,
        fee
      };

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
        const mempoolTransactionsPromise = mempool.map(async (m) => {
          // Transaction id:
          const txid = m.tx_hash;
          return await utils.decodeTransaction({
            txid,
            electrumClient,
            network
          });
        });
        const mempoolTransactions = await Promise.all(mempoolTransactionsPromise);
        await electrumClient.close();

        return mempoolTransactions; 
      }
    } catch (e) {
      throw new Error(e.message);
    }
    return [];
  };

  // get list of past transactions. could paging be better?
  const getHistory = async ({ address, networkConfig, start = 0, limit = 100 }) => {
    try {
      const electrumClient = await getElectrumClient(networkConfig);
      const network = utils.getNetwork({ networkConfig });
      const history = await electrumClient.blockchainAddress_getHistory(address);
      //console.log(history);
      if (history && history.length > 0) {
        // We cannot limit Electrum query, but we can decode only transaction within limit
        const txsToDecode = history.splice(start, limit);
        const decodedTransactionsPromise = txsToDecode.map(async (tx) => {
          const txid = tx.tx_hash;
          const txDecoded = await utils.decodeTransaction({
            txid,
            electrumClient,
            network
          });
          if (tx.height > 0) {
            const blockHeader = await electrumClient.blockchainBlock_getHeader(tx.height);
            txDecoded.timestamp = blockHeader.timestamp;
          } else {
            txDecoded.timestamp = null;
          }
          // Format amounts
          Object.keys(txDecoded.sender).forEach(addr => {
            txDecoded.sender[addr] = niceFloat(txDecoded.sender[addr]);
          });
          Object.keys(txDecoded.receiver).forEach(addr => {
            txDecoded.receiver[addr] = niceFloat(txDecoded.receiver[addr]);
          });
          return txDecoded;
        });
        const decodedTransactions = await Promise.all(decodedTransactionsPromise);
        await electrumClient.close();

        return decodedTransactions;
      }
    } catch (e) {
      throw new Error(e.message);
    }
    return [];
  };

  // get transaction details
  const getTransactionDetails = async ({ networkConfig, txid }) => {
    try {
      const electrumClient = await getElectrumClient(networkConfig);
      const network = utils.getNetwork({ networkConfig });
      const transaction = await utils.decodeTransactionAdvanced({
        txid,
        electrumClient,
        network
      });
      await electrumClient.close();
      return { ...transaction };
    } catch (e) {
      throw new Error(e.message);
    }
  };

  const estimateFee = async ({ networkConfig }) => {
    const electrumClient = await getElectrumClient(networkConfig);
    let blocks = 6;
    let feePerKb = -1;
    while (feePerKb === -1) {
      // btc/kb
      feePerKb = await electrumClient.blockchainEstimatefee(blocks);
      blocks += 6;
    };
    await electrumClient.close();
    
    const avTxSize = 250; // byte
    let fee = utils.parse(avTxSize * feePerKb / 1000);
    const digits = /[1-9]/.exec(fee.toString().substring(2)).index + 2;
    fee = parseFloat(fee.toFixed(digits));
    const min = parseFloat(utils.parse(fee - fee * 0.9).toFixed(digits)); // -90%
    const max = parseFloat(utils.parse(fee + fee * 0.9).toFixed(digits)); // +90%

    // Find step:
    const step = parseFloat('0.' + '1'.padStart(digits + 1 , '0'));

    return { fee, min, max, step, units: 'BTC', label: 'fee' };
  };

  return {
    isValidAddress,
    addressFromPrivateKey, // getting address from private key and network config (optional)
    decryptPrivateKey,
    encryptPrivateKey,
    isValidPrivateKey,
    create,
    getAssetsList,
    sendTransaction,
    getPending,
    getHistory,
    getTransactionDetails,
    estimateFee
  };

}
