const chai = require('chai');
const { expect, should } = chai;
chai.use(require('chai-http'));

// take server module, with dummy mock of the storage
require('./../services/storage.mock');
const app = require('./../server');

const expectedData = (err, res) => {
  expect(err).to.be.null;
  expect(res).to.have.status(200);
  const { data } = res.body;
  return data;
};

describe('/api/wallets', () => {
  it('should give list of wallets', (done) => {
    chai.request(app).get('/api/wallets')
      .end((err, res) => {
        const { wallets } = expectedData(err, res);
        expect(Array.isArray(wallets)).to.be.true;
        done();
     });
  });

  it('should append a wallet to a storage', (done) => {
    chai.request(app).post('/api/wallets')
      .set('Content-Type', 'application/json')
      .send({ 
	 network: 'ETH',
	 name: 'ETH Wallet ' + Math.random(),
	 address: '0xcfbed64c7fcb8c877ebdedbce9f7d6136cfeb882',
	 privateKey: '876d869a60b4331de82a8020c64bca46f634c9cf6b87d0420ea96f95f08c90ad'
      })
      .end((err, res) => {
        const data = expectedData(err, res);
        const { privateKey } = data;
        // expect(typeof id).to.equal("string");
        expect(typeof privateKey).to.equal("undefined");
        done();
     });
  });

  it('should generate and  wallet to a storage', (done) => {
    chai.request(app).post('/api/wallets/generate')
      .set('Content-Type', 'application/json')
      .send({ name: "Default ETH Wallet", network: 'ETH', networkId: "", testnet: false })
      .end((err, res) => {
        const data = expectedData(err, res);
        const { id, privateKey } = data;
        expect(typeof id).to.equal("string");
        expect(typeof privateKey).to.equal("undefined");
        done();
     });
  });

  // TODO: should read individual wallet information?
  // TODO: should delete wallet information


});
