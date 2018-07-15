const chai = require('chai');
const { expect, should } = chai;
chai.use(require('chai-http'));

// take server module, with dummy mock of the storage
require('./../services/storage.mock');
const app = require('./../server');

describe('/api/wallets', () => {
  it('should give list of wallets', (done) => {
    chai
      .request(app).get('/api/wallets')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        const { data } = res.body;
        const { wallets } = data;
        expect(Array.isArray(wallets)).to.be.true;
        done();
     });   
  });


});
