// 
// THIS MODULE CONTAINS SUPER-PRIVILEGED OPERATIONS
// THAT ARE REQUIRED ONLY FOR LOCAL TESTRPC TESTS
// 
module.exports = ({ network = 'ETH' }) => {

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

  const createTokenContract = ({ web3, symbol, decimals = 18 }) => {
  };

  const transferTokens = ({ web3, symbol, from, to, value }) => {
  };

  return {
    createRandomAccount,
    creditAccount,
    createTokenContract,
    transferTokens
  };
};