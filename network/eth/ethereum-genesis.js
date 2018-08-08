//
// THIS MODULE CONTAINS SUPER-PRIVILEGED OPERATIONS
// THAT ARE REQUIRED ONLY FOR LOCAL TESTRPC TESTS
//
module.exports = ({ network = 'ETH' }) => {

  const createDebug = require('debug');

  const createRandomAccount = ({ web3 }) => {
    // address from privatekey:
    // https://github.com/yuanfeiz/simple-eth-addr-generator/blob/master/index.js
    const address = web3.personal.newAccount('');
    if (address.indexOf('0x') !== 0) throw new Error('Address should start with 0x');
    return { address };
  };

  const creditAccount = ({ web3, address, value }) => {
    return new Promise((resolve, reject) => {
        web3.eth.sendTransaction({ to: address, from: web3.eth.accounts[0], value }, (error, result) => {
            if (error) { reject( error ); }
            resolve(result);
        });
    })
  };

  const createTokenContract = ({ web3, contractName, abi, bytecode }) => {
    const debug = createDebug('eth.createTokenContract');
    const sleep = (ms) => (new Promise(resolve => (setTimeout(resolve, ms))));

    return new Promise((resolve, reject) => {
      if (!abi) { return reject("Contract ABI is missing"); }
      if (!bytecode) { return reject("Contract bytecode is missing"); }

      try {
        // Smart contract EVM bytecode as hex
        const code = bytecode;
        // Create Contract proxy class
        const theContract = web3.eth.contract(abi);
        debug("Deploying the contract " + contractName);

        const contract = theContract.new({ from: web3.eth.accounts[0], gas: 1999999, data: code});
        debug("CONTRACT=", Object.keys(contract));
        // Transaction has entered to geth memory pool
        debug("Contract is being deployed tx=" + contract.transactionHash);

        const receipt = web3.eth.getTransactionReceipt(contract.transactionHash);
        debug("Your contract has been deployed at " + receipt.contractAddress);
        resolve(receipt.contractAddress);
      } catch (e) { reject(e); }
    });
  };

  // NOTE: this is valid transfer only for test environment.
  // Real environment should sign it differently
  const creditTokens = ({ web3, contractAddress, abi, to, tokens }) => {
    const debug = createDebug('eth.creditTokens');
    return new Promise((resolve, reject) => {
      try {
        const contractAbi = web3.eth.contract(abi);
        const theContract = contractAbi.at(contractAddress);
        const data = theContract.transfer.getData(to, tokens);
        web3.eth.sendTransaction({
          to: contractAddress, from: web3.eth.accounts[0], data
        },  (err, txHash) => {
          if (err) { return reject(err); }
          debug("txHash=", txHash);
          const receipt = web3.eth.getTransactionReceipt(txHash);
          resolve(receipt);
        });
      } catch (e) { reject(e); }
    });
  };

  return {
    createRandomAccount,
    creditAccount,
    createTokenContract,
    creditTokens
  };
};
