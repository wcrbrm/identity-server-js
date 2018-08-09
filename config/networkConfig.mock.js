module.exports = {
  BTC: {
    // USE THIS KIND OF MOCK SO FAR.
    // Closer to production, we will use 
    value: 'BTC', 
    name: 'Bitcoin',
    icon: '/networks/BTC.png',
    testnet: true, 
    //networkId: 'REGTEST',
    // rpcRoot: 'http://localhost:18443' // only if networkId is absent
    rpcRoot: 'http://localhost:19001',
    rpcAuth: {
      // username: 'me',
      // password: 'mypassword'
      username: 'admin1',
      password: '123'
    },
    electrum: {
      host: '127.0.0.1',
      port: '50001',
      protocol: 'tcp'
    }
  }
}