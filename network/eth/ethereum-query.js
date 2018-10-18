const axios = require('axios');
const ethereumUtil = require('ethereumjs-util');
const BigNumber = require('bignumber.js');
const encodeHelper = require('./ethereum-encodehelper');

const genRpcId = () => (new Date().getTime()) + '.' + Math.random();

const query = ({ method, params, endpoint }) => (
  axios({
    url: '/',
    baseURL: endpoint,
    method: 'post',
    headers: { 'content-type': 'text/plain' },
    data: JSON.stringify({ id: genRpcId(), jsonrpc: '2.0', method, params })
  }).then(response => {
    if (response.data && response.data.result) {
      return response.data.result;
    } else if (response.data.error) {
      throw new Error(response.data.error.message);
    }else {
      throw new Error('Unexpected response');
    }
  }).catch(error => {
    throw new Error(error.message);
  })
);

const isRPCAccessible = async ({ endpoint }) => {
  try {
    return await query({ method: 'web3_clientVersion', endpoint });
  } catch (error) {
    return false;
  }
};

const callContract = async ({ 
  address,
  contractAddress,
  abi,
  contractMethod,
  contractParams, // array
  endpoint 
}) => {
  abi = abi || encodeHelper.getErc20Abi();
  const data = encodeHelper.encodeTxData({ method: contractMethod, params: contractParams, abi });
  const response = await query({ method: 'eth_call', params: [
    { 
      to: contractAddress,
      from: address,
      data 
    }, 'latest'
  ], endpoint });

  return encodeHelper.decodeTxOutput({ method: contractMethod, data: response, abi });
};

module.exports = {
  query,
  isRPCAccessible,
  callContract,
};