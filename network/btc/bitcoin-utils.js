const bitcoinJs = require('bitcoinjs-lib');

const getNetwork = ({ networkConfig }) => {
  // Regtest is also a Testnet, no special config needed
  return networkConfig.testnet ? bitcoinJs.networks.testnet : bitcoinJs.networks.bitcoin;
};

const getAddressFromPubKey = ({ walletPublicConfig }) => {
  const { publicKey, networkConfig } = walletPublicConfig;
  const publicKeyBuffer = Buffer.from(publicKey, 'hex');
  const network = getNetwork({ networkConfig });
  return bitcoinJs.ECPair.fromPublicKeyBuffer(publicKeyBuffer, network).getAddress();
  //return bitcoinJs.payments.p2pkh({ pubkey: publicKeyBuffer, network }).address; // v4+
};

// Bitcoin-core
const getTxsToSpend = ({ unspentTransactions, amount }) => {
  let sum = 0;
  const transactionsToUse = unspentTransactions.sort((tx1, tx2) => (
    tx2.confirmations - tx1.confirmations
  )).filter(tx => {
    const oldSum = sum;
    sum += tx.amount;
    return oldSum <= amount;
  });
  return transactionsToUse;
};

// Electrum
const getTxsToSpend2 = ({ unspent, amount }) => {
  let sum = 0;
  return unspent.filter(tx => {
    const oldSum = sum;
    sum += parseSatoshi(tx.value);
    return oldSum <= amount;
  });
};

const generateTxInputs = ({ transactionsToSpend }) => {
  const rawTxInputs = transactionsToSpend.map(tx => (
    {
      txid: tx.txid,
      vout: tx.vout
    }
  ));
  return rawTxInputs;
};

const generateTxOutputs = ({ transactionsToSpend, amount, fee, to, change }) => {
  const txsSum = transactionsToSpend.reduce((acc, tx) => acc + tx.amount, 0);
  const rawTxOutputs = {
    [to]: amount,
    [change]: parseFloat((txsSum - amount - fee).toFixed(8))
  };
  return rawTxOutputs;
};

const parse = (value) =>  parseFloat(value.toFixed(8));

const parseSatoshi = value => value / Math.pow(10, 8);

const toSatoshi = (value) => value * Math.pow(10, 8);

// https://github.com/you21979/node-multisig-wallet/blob/master/lib/txdecoder.js:

const decodeInput = (tx) => {
  const result = [];
  tx.ins.forEach((input, n) => {
      const vin = {
          txid: input.hash.reverse().toString('hex'),
          n : input.index,
          script: bitcoinJs.script.toASM(input.script),
          sequence: input.sequence,
      }
      result.push(vin);
  })
  return result
};

const decodeOutput = (tx, network) => {
  const format = (out, n, network) => {
      const vout = {
          satoshi: out.value,
          value: (1e-8 * out.value).toFixed(8),
          n: n,
          scriptPubKey: {
              asm: bitcoinJs.script.toASM(out.script),
              hex: out.script.toString('hex'),
              type: bitcoinJs.script.classifyOutput(out.script),
              addresses: [],
          },
      };
      switch(vout.scriptPubKey.type){
        //case 'pubkey':
        case 'pubkeyhash':
        case 'scripthash': {
            vout.scriptPubKey.addresses.push(bitcoinJs.address.fromOutputScript(out.script, network));
          break;
        }
      }
      return vout;
  }

  const result = [];
  tx.outs.forEach((out, n) => {
    result.push(format(out, n, network));
  });
  return result;
};

const decodeTransaction = async ({ txid, electrumClient, network }) => {
  console.log(txid);
  // Transaction data hash:
  const hex = await electrumClient.blockchainTransaction_get(txid);
  // Transaction as Buffer:
  const tx = bitcoinJs.Transaction.fromHex(hex);

  // Sender:
  // https://bitcoin.stackexchange.com/questions/28182/how-to-find-the-change-sender-address-given-a-txid
  // Process transaction inputs:
  const inputs = decodeInput(tx);
  //console.log(inputs);
  const senders = inputs.map(async (input) => {
    const addresses = [];
    const iTxid = input.txid;
    const iN = input.n;
    const iHex = await electrumClient.blockchainTransaction_get(iTxid);
    const iTx = bitcoinJs.Transaction.fromHex(iHex);
  
    const outputs = decodeOutput(iTx, network);
    outputs.forEach(output => {
      if (output.n === iN) {
        output.scriptPubKey.addresses.forEach(a => addresses.push(a));
      }
    });
    return addresses;
  });
  const senderSet = new Set();
  const senderAddresses = await Promise.all(senders);
  senderAddresses.forEach(addrArr => addrArr.forEach(addr => senderSet.add(addr)));
  const sender = [...senderSet];

  // Receiver:
  // Process transaction outputs
  const outputs = decodeOutput(tx, network);
  const receiver = {};
  outputs.forEach(o => {
    const address = o.scriptPubKey.addresses[0];
    receiver[address] = o.value;
  });
  
  return {
    txid,
    sender,
    receiver
  };
};

module.exports = {
  getNetwork,
  getAddressFromPubKey,
  getTxsToSpend,
  getTxsToSpend2,
  generateTxInputs,
  generateTxOutputs,
  parse,
  parseSatoshi,
  toSatoshi,
  decodeTransaction,
  decodeInput,
  decodeOutput
}
