const chai = require('chai');
chai.should();
const { expect } = chai;
chai.use(require('chai-http'));

// take server module, with dummy mock of the storage
require('./../services/storage.mock');
const app = require('./../server');

const expectData = (err, res) => {
  expect(err).to.be.null;
  expect(res).to.have.status(200);
  res.body.should.be.a('object');
  res.body.data.should.be.a('object');
  return res.body.data;
};

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
    it('Address Validation (Checksum)', (done) => {
      const address = '0x939c4eb44c9ffd7f63c108ecd93013e02d23bb26';
      chai
        .request(app).get(`/api/networks/ETH/address/${address}`)
        .end((err, res) => {
          const { valid, checksum } = expectData(err, res);
          valid.should.equal(true);
          checksum.should.equal(false);
          done();
        });
    });
    it('Address Validation', (done) => {
      const address = '0xe17ED9eD45fFAeAbf01970f7C05Ca1bcD15Fd241';
      chai
        .request(app).get(`/api/networks/ETH/address/${address}`)
        .end((err, res) => {
          const { valid, checksum } = expectData(err, res);
          valid.should.equal(true);
          checksum.should.equal(true);
          done();
        });
    });
    it('Invalid Address Validation', (done) => {
      const address = 'e17ED9eD45fFAeAbf01970f7C05Ca1bcD15Fd241';
      chai
        .request(app).get(`/api/networks/ETH/address/${address}`)
        .end((err, res) => {
          const { valid, error } = expectData(err, res);
          console.log(res.body);
          valid.should.equal(false);
          error.should.be.a('string');
          done();
        });
    });
});