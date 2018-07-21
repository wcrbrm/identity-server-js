module.exports = {
  BTC: {
    // USE THIS KIND OF MOCK SO FAR.
    // Closer to production, we will use 
    value: 'BTC', 
    name: 'Bitcoin',
    icon: '/networks/BTC.png',
    testnet: true, 
    networkId: 'REGTEST',
    // rpcRoot: 'http://localhost:18443' // only if networkId is absent
    rpcAuth: {
      username: 'me',
      password: 'mypassword'
    }
  }
}