const ethereumAbi = require('ethereumjs-abi');
const ethereumUtil = require('ethereumjs-util');
const BigNumber = require('bignumber.js');
const BN = require('bn.js');
       
const decodeTxData = ({ data }) => {
  const abi = getErc20Abi();

  // Find method name from signature
  const methodSignature = data.slice(2, 10);

  // To find a method by signature, it is needed to create poll of sigranures for all ABI methods
  const signatures = {};
  abi.forEach(methodSpec => {
    const methodHash = encodeMethod({ methodSpec });
    signatures[methodHash] = methodSpec.name;
  });

  // Search abi for method name
  const method = signatures[methodSignature];
  const methodSpec = getMethodSpec({ method, abi });

  // Make array of types of input parameters 
  const inputTypes = methodSpec.inputs.map(input => input.type);

  const decoded = ethereumAbi.rawDecode(inputTypes, Buffer.from(data.slice(10), 'hex'));
  
  const res = {};
  decoded.forEach((val, i) => {
    const paramName = methodSpec.inputs[i].name.slice(1);
    const paramType = methodSpec.inputs[i].type;
    // TODO handle more types
    res[paramName] = formatType({ val, type: paramType });
  });

  return res;
};

const encodeTxData = ({ method, params, abi }) => {
  abi = abi || getErc20Abi();
  const methodSpec = getMethodSpec({ method, abi });
  const methodHash = encodeMethod({ methodSpec });
  const paramTypes = getParamTypes({ inputs: methodSpec.inputs });
  const paramsHash = ethereumAbi.rawEncode(paramTypes, params).toString('hex');
  const data = `0x${methodHash}${paramsHash}`;
  return data;
};

const decodeTxOutput = ({ method, data, abi }) => {
  abi = abi || getErc20Abi();
  const methodSpec = getMethodSpec({ method, abi });
  const outputTypes = getOutputTypes({ outputs: methodSpec.outputs });
  const decoded = ethereumAbi.rawDecode(outputTypes, Buffer.from(data.slice(2), 'hex'));
  const res = formatType({ val: decoded.pop(), type: outputTypes.pop() });
  return res;
};

const getErc20Abi = () => {
  const fs = require('fs');
  const jsonPath = __dirname + "/MyToken.json";
  const json = JSON.parse(fs.readFileSync(jsonPath));
  const { abi } = json;
  return abi;
};

const encodeMethod = ({ methodSpec }) => {
  const contractMethod = methodSpec.name;
  const paramTypes = getParamTypes({ inputs: methodSpec.inputs });
  return ethereumAbi.methodID(contractMethod, paramTypes).toString('hex');
};

const getMethodSpec = ({ method, abi }) => {
  // Get contract method specification from ABI
  return abi.find(spec => {
    if (spec.name === method) return spec;
  });
};

const formatType = ({ val, type }) => {
  switch (type) {
    case 'address':
      return `0x${val}`;
    case 'uint256':
    case 'uint8':
      return BN.isBN(val) ? val.toString(10) : val;
    case 'string':
    default:
      return val;
  }
};

const makeTransactionParams = ({ asset, from, to, value, data = '', contractAddress }) => {
  const txParams = { from }; 

  if (asset !== 'ETH') {
    // Smart contract transaction
    const abi = getErc20Abi();
    txParams.to = contractAddress;

    if (!data) {
      // Transfer asset to another address

      // data: method - transfer, _to - address, _value - uint256
      txParams.data = encodeTxData({ method: 'transfer', params: [ to, value ], abi });
    } else {
      // Call custom method of contract
      txParams.data = '0x' + Buffer.from(data, 'hex').toString('hex');
    }

  } else {
    // ETH transaction 
    txParams.to = to;
    txParams.value = value;
    txParams.data = '0x' + Buffer.from(data, 'hex').toString('hex');
  }

  return txParams;
};

const getParamTypes = ({ inputs }) => inputs.map(input => input.type);

const getOutputTypes = ({ outputs }) => outputs.map(output => output.type);

//const fromWei = (valueWei) => (new BigNumber(valueWei).dividedBy(new BigNumber(Math.pow(10, 18)))).toString();

module.exports = {
  getErc20Abi,
  decodeTxData,
  encodeMethod,
  getMethodSpec,
  encodeTxData,
  makeTransactionParams,
  decodeTxOutput
};