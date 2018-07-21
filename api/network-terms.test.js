const chai = require('chai');
const { expect, should } = chai;
chai.use(require('chai-http'));

// take server module, with dummy mock of the storage
require('./../services/storage.mock');
const app = require('./../server');

// mocking config
const networkConfigs = require('./../config/networks.js');
networkConfigs.Networks = [
  { value: 'EOS', name: 'EOS', terms: true },
  { value: 'NOTERM', name: 'Chain without terms' },
  { value: 'XYZ', name: 'XYZ chain, without terms file', terms: true }
];

describe('/api/network/XXX/terms', () => {
  it('EOS should have terms', (done) => {
    chai
      .request(app).get('/api/networks/EOS/terms')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        done();
     });   
  });

  it('NOTERM should have no terms', (done) => {
    chai
      .request(app).get('/api/networks/NOTERM/terms')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(500);
        done();
     });   
  });

  it('XYZ should have no terms', (done) => {
    chai
      .request(app).get('/api/networks/XYZ/terms')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(500);
        done();
     });   
  });


});
