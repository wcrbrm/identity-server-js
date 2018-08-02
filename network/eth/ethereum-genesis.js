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
        console.log("Deploying the contract " + contractName);

        const contract = theContract.new({ from: web3.eth.accounts[0], gas: 9999999, data: code});
        console.log("CONTRACT=", Object.keys(contract));
        // Transaction has entered to geth memory pool
        console.log("Contract is being deployed tx=" + contract.transactionHash);

        const receipt = web3.eth.getTransactionReceipt(contract.transactionHash);
        debug("Your contract has been deployed at " + receipt.contractAddress);
        resolve(receipt.contractAddress);
      } catch (e) { reject(e); }
    });
  };

  const transferTokens = ({ web3, contractAddress, abi, from, to, value }) => {
    console.log('Transferring from=', from, 'to=', to, 'value=', value, 'contractAddress=', contractAddress);
    console.log(abi.filter(f => (f.name === 'transfer')));

    const theContract = web3.eth.contract(abi);
    console.log(Object.keys(theContract.eth));

    // for web3@1.x.x:
    // tx = { value: '0x0', from: from, to: Contract._address, data: Contract.methods.transfer(to, 1000).encodeABI()}
  };

  return {
    createRandomAccount,
    creditAccount,
    createTokenContract,
    transferTokens
  };
};
