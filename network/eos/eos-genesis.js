// 
// THIS MODULE CONTAINS SUPER-PRIVILEGED OPERATIONS
// THAT ARE REQUIRED ONLY FOR LOCALNET TESTS
// 
module.exports = ({ network = 'EOS' }) => {
    const Eos = require('eosjs');
    const keyProvider = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';
    const modEos = require('./eos')({ network });

    const getRandomAccount = () => {
        const nLetters = 10;
        const nDigits = 2;
        const randomFrom = chars => (chars.charAt(Math.random() * chars.length));
        return Array(nLetters + nDigits).fill().map((undef, index) => (
            randomFrom((index < nLetters) ? "abcdefghijklmnopqrstuvwxyz" : "1234") 
        )).join('');
    };

    const createRandomAccount = async () => {
        const accountId = getRandomAccount();
        const { publicKey, privateKey } = await modEos.createRandom();

        const eos = Eos({ keyProvider });
//         console.log('randomAccount=', accountId);
        const tx = await eos.transaction(tr => {
            tr.newaccount({
                creator: 'eosio',
                name: accountId,
                owner: publicKey,
                active: publicKey
            });
            tr.buyrambytes({
                payer: 'eosio',
                receiver: accountId,
                bytes: 8192
            });
            tr.delegatebw({
                from: 'eosio',
                receiver: accountId,
                stake_net_quantity: '10.0000 SYS',
                stake_cpu_quantity: '10.0000 SYS',
                transfer: 0
            });
        });
        return { tx, accountId, publicKey, privateKey };
    };

  return {
    createRandomAccount
  };
};