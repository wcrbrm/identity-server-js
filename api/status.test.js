
describe('status endpoint', () => {
  it('should work', () => {

    const modStorage = require('./../services/storage');
    modStorage.getStorageJson = () => (console.warn('getting storage was replaced successfully'));

    const options = {};
    const modStatus = require('./status')(options);    

  });
});
