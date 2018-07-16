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

describe('/api/storage', () => {

  it('should create a storage', (done) => {
    chai.request(app).post('/api/storage')
      .set('Content-Type', 'application/json')
      .send({ seed: '0000000000', pinCode: '111111', format: 'BTC' })
      .end((err, res) => {
        expectedData(err, res);
        done();
     });   
  });

  // TODO: should not create in case of missing seed, pinCode, format

});
