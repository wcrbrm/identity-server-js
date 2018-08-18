const Networks = [
  // {
  //   value: 'B2X', name: 'Segwit 2X', icon: '/networks/B2X.png',
  //   local: 'http://localhost:8333',
  //   disabled: true
  // },
  {
    value: 'BCH', name: 'Bitcoin Cash', icon: '/networks/BCH.png',
    local: 'http://localhost:8333',
    disabled: true
  },
  {
    value: 'BTC', name: 'Bitcoin', icon: '/networks/BTC.png',
    local: 'http://localhost:8333',
    disabled: ['watch'],
    // TODO mainnet config
    api: [
      // Electrum mainnet servers
      // 
    ],
    testnets: [
      // TODO testnet config
      {
        networkId: 'REGTEST',
        rpc: 'http://admin1:123@localhost:19001',
        api: 'tcp://127.0.0.1:50001',
      },
      {
        networkId: 'TESTNET',
        api: [
          // Electrum testnet servers
        ]
      }
    ]
  },
  // {
  //   value: 'BTD', name: 'Bitcoin Diamond', icon: '/networks/BTD.png',
  //   local: 'http://localhost:8333',
  //   disabled: true
  // },
  // {
  //   value: 'BTG', name: 'Bitcoin Gold', icon: '/networks/BTG.png',
  //   local: 'http://localhost:18338',
  //   spec: 'https://github.com/BTCGPU/BTCGPU/wiki/Technical-Spec',
  //   disabled: true
  // },
  {
    value: 'EOS', name: 'EOS', terms: true, icon: '/networks/EOS.png',
    multiAccount: true,
    local: 'http://localhost:8888',
    testnets: [
      { value: 'jungle', name: 'Jungle TestNet', explorer: 'http://dev.cryptolions.io/' },
      { value: 'scholar', name: 'Scholar TestNet', explorer: 'https://scholar.eosnation.io/' }
    ]
  },
  {
    value: 'ETC', name: 'Ethereum Classic', icon: '/networks/ETC.png', EIP55: true,
    local: 'http://localhost:8545',
    disabled: true
  },
  {
    value: 'ETH', name: 'Ethereum', icon: '/networks/ETH.png', EIP55: true,
    local: 'http://localhost:8545',
    api: 'http://localhost:9911',
    apiName: 'EtherScan API',
    apiKeys: [
      'J6I6DJSFE763ISRXWI5XCCX23NTTDTHFTM',
      'IZB9M5G3A9IFSB9H9V3BQWNE358HKQAXU9',
      '4RD2ZMMQ7SYD9JK6KQZSVCFK8RNATFIIDI'
    ],
    testnets: [
      {
        value: 4, name: 'Rinkeby',
        explorer: 'https://rinkeby.etherscan.io/',
        rpc: 'https://mainnet.infura.io/56VWha01KDTpZ0kRTDCN',
        api: 'https://api-rinkeby.etherscan.io'
      },
      {
        value: 3, name: 'Ropsten',
        explorer: 'https://ropsten.etherscan.io/',
        rpc: 'https://ropsten.infura.io/56VWha01KDTpZ0kRTDCN',
        api: 'https://api-ropsten.etherscan.io'
      },
      {
        value: 42, name: 'Kovan',
        explorer: 'https://kovan.etherscan.io/',
        rpc: 'https://kovan.infura.io/56VWha01KDTpZ0kRTDCN',
        api: 'https://api-kovan.etherscan.io'
      },
      // we don't have that network in INFURA services
      // {
      //   value: 0x62121,
      //   name: 'Tobalaba',
      //   explorer: 'https://tobalaba.etherscan.com/',
      //   api: 'https://api-tobalaba.etherscan.com'
      // },
    ]
  },
  {
    value: 'LTC', name: 'Litecoin', icon: '/networks/LTC.png',
    local: 'http://localhost:19335',
    disabled: true
  },
  {
    value: 'NEO', name: 'NEO', icon: '/networks/NEO.png',
    local: 'http://localhost:20332',
    disabled: true
  },
  {
    value: 'WAN', name: 'Wanchain', icon: '/networks/WAN.png', EIP55: true,
    local: 'http://localhost:8546',
    disabled: true
  }
];

module.exports = {
   Networks
};


