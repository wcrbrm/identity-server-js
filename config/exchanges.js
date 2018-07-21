
const Exchanges = [
  { value: 'binance',  name: 'Binance',  icon: '/exchanges/binance.png', keys: [
    { id: "apiKey", label: "API KEY" },
    { id: "secretApiKey", label: "Secret" }
  ] },
  { value: 'bitfinex', name: 'Bitfinex', icon: '/exchanges/bitfinex.png', disabled: true, keys: [
    { id: "apiKey", label: "API KEY" },
    { id: "secretApiKey", label: "Secret" }
  ] },
  { value: 'bittrex',  name: 'Bittrex',  icon: '/exchanges/bittrex.png', keys: [
    { id: "apiKey", label: "API KEY" },
    { id: "secretApiKey", label: "Secret" }
  ] },
  { value: 'coinex',  name: 'CoinEx',  icon: '/exchanges/coinex.png', disabled: true, keys: [
    { id: "accessId", label: "Access ID" },
    { id: "secretKey", label: "Secret Key" }
  ] },
  { value: 'hitbtc',   name: 'HitBTC',   icon: '/exchanges/hitbtc.png', disabled: true, keys: [
      { id: "apiKey", label: "API KEY" },
      { id: "secretApiKey", label: "Secret" }
  ] },
  { value: 'huobi',   name: 'Huobi',   icon: '/exchanges/huobi.png', disabled: true, keys: [
    { id: "apiKey", label: "API KEY" },
    { id: "secretApiKey", label: "Secret Key" }
  ] },
  { value: 'kucoin',   name: 'Kucoin',   icon: '/exchanges/kucoin.png', keys: [
      { id: "apiKey", label: "API KEY" },
      { id: "secretApiKey", label: "Secret" }
  ] },
  { value: 'liqui',   name: 'Liqui',   icon: '/exchanges/liqui.png', disabled: true, keys: [
      { id: "apiKey", label: "API KEY" },
      { id: "secretApiKey", label: "Secret" }
  ] }
];

module.exports = { Exchanges };