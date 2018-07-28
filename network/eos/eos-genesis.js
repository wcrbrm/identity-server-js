// 
// THIS MODULE CONTAINS SUPER-PRIVILEGED OPERATIONS
// THAT ARE REQUIRED ONLY FOR LOCALNET TESTS
// 
module.exports = ({ network = 'EOS' }) => {
    const Eos = require('eosjs');

    const getRandomAccount = () => {
        const nLetters = 10;
        const nDigits = 2;
        const randomFrom = chars => (chars.charAt(Math.random() * chars.length));
        return Array(nLetters + nDigits).fill().map((undef, index) => (
            randomFrom((index < nLetters) ? "abcdefghijklmnopqrstuvwxyz" : "1234") 
        )).join('');
    };

    const createRandomAccount = () => {
        console.log('randomAccount=', getRandomAccount());
    };

  return {
    createRandomAccount
  };
};