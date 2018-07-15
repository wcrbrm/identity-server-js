require('./../services/storage.mock');

const chai = require('chai');
const { expect, should } = chai;
chai.use(require('chai-http'));

const app = require('./../server');

describe('/api/status', () => {
  it('should work', (done) => {
    chai
      .request(app).get('/api/status')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
     });   
  });
});
