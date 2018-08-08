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
      .send({ publicKey: '000000', privateKey: '111111', network: 'BTC' })
      .end((err, res) => {
        const data = expectedData(err, res);
        const { id, privateKey } = data;
        expect(typeof id).to.equal("string");
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
