const should = require('chai').should();
const Application = require('spectron').Application;
const electronPath = require('electron');
const path = require('path');

const pathToRegexp = require('path-to-regexp');
const urlPatterns = [
  '/api/status',
  '/api/storage',
  '/api/wallets',
  '/api/wallets/generate',
  '/api/wallets/:id',
  '/api/wallets/:id/assets',
  '/api/wallets/:id/assets/:assetId',
  '/api/wallets/:id/pdf',
  '/api/networks',
  '/api/networks/:networkId/terms',
  '/api/networks/:networkId/status',
  '/api/networks/:networkId/address/:address',
];

describe('Electron IPC functionality test', () => {
  // beforeEach(async () => {
  //   this.app = new Application({
  //     path: electronPath,
  //     args: [path.join(__dirname, '../main.js')],
  //     //requireName: 'require'
  //   })
  //   return this.app.start();
  // });

  // afterEach(async () => {
  //   if (this.app && this.app.isRunning()) {
  //     return this.app.stop();
  //   }
  // });

  // it('shows an initial window', async () => {
  //   const count = await this.app.client.getWindowCount();
  //   count.should.equal(2);
  // })

  // it.skip('Send and receive IPC message', () => {
  //   // Cannot get electron API when nodeIntegration is false. Cannot set it to true
  //   console.log(this.app.api.nodeIntegration);
  // });

  it('Extract params from url', () => {
    
    const getParams = ({ url }) => {
      const params = {};
      urlPatterns.forEach(p => {
        const keys = [];
        const re = pathToRegexp(p, keys);
        if (keys.length > 0) {
          const results = re.exec(url);
          if (results) {
            keys.forEach((key, i) => {
              params[key.name] = results[i + 1]; 
            });
          }
        }
      });
      return params;
    };

    const url = '/api/wallets/d545794ce045dfce898e4a4c823cbcd23727bb91/assets/cd6664d44e064c6bc9154d242b245ef75b12ec63';
    const params = getParams({ url });
    params.should.have.property('id', 'd545794ce045dfce898e4a4c823cbcd23727bb91');
    params.should.have.property('assetId', 'cd6664d44e064c6bc9154d242b245ef75b12ec63');
  });

  it('Find pattern from url', () => {
    const url = '/api/wallets/d545794ce045dfce898e4a4c823cbcd23727bb91/assets/cd6664d44e064c6bc9154d242b245ef75b12ec63';

    const getUrlPattern = ({ url }) => {
      for (let i = 0; i < urlPatterns.length; i++) {
        if (pathToRegexp(urlPatterns[i]).test(url)) {
          return urlPatterns[i];
        }
      }
    };
    getUrlPattern({ url }).should.equal('/api/wallets/:id/assets/:assetId');
  });

});