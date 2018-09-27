const axios = require('axios');

const genRpcId = () => (new Date().getTime()) + '' + Math.random();

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
    } else {
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

module.exports = {
  query,
  isRPCAccessible,
};