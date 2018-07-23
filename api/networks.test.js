const chai = require('chai');
const { expect } = chai;
chai.use(require('chai-http'));

// take server module, with dummy mock of the storage
require('./../services/storage.mock');
const app = require('./../server');

describe('/api/networks', () => {
    it('endpoint should work', (done) => {
      chai
        .request(app).get('/api/networks')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);

          const modules = require('./../network/index');

          const len = res.body.data.networks.length;
          expect(len).to.equal(Object.keys(modules).length);
          done();
       });   
    });
});