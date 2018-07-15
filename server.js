const http = require("http");
const express = require("express");
const bodyParser = require('body-parser');
const options = require('./options');

const app = express();
app.use(bodyParser.json());

if (options.cors) {
  app.use(require('cors')());
}
const root = '/api';

app.get(`${root}/status`, require('./api/status')(options));

/*
API of the installation

// status should provide public key of the setup

// and the endpoint for creating storage, should go encrypted
// for decoding only with the private key
app.post(`${root}/storage`, require('./api/install/storage'));

// endpoint that is used for restoring
// should accept publicKey
app.post(`${root}/restore`, require('./api/install/restore'));

// endpoint to create/update pairing password
app.post(`${root}/pair`, require('./api/install/pair')();
// endpoint to establist a connection using pairing password
app.post(`${root}/connect`, require('./api/install/connect')());

app.get(`${root}/settings`, require('./api/settings')());
app.post(`${root}/settings`, require('./api/settings')());

// do we need lock and unlock endpoints at all?
// at first sight it looks insecure
// may be it should be just always locked
app.post(`${root}/lock`, require('./api/lock')());
app.post(`${root}/unlock`, require('./api/unlock`)());
*/

// getting list of the wallets
const modWallets = require('./api/wallets');
app.get(`${root}/wallets`,  modWallets('list', options));
app.post(`${root}/wallets`, modWallets('create', options));
app.delete(`${root}/wallets/:id`, modWallets('delete', options));
app.get(`${root}/wallets/:id`,    modWallets('info', options));


// pairing could actually be useful only to remote connections
// remote access tab can be a part of installation wizard or a part of the settings?

// pair validation is basically (remote IP address + browser)??
// cannot be for keeping remote installatino


// MAIN QUESTION: how to pair?
// proposal 1. 


// binding, on successfull installation it returns
// a pair of public/secret key (generated for the storage)
// it could be small enough?

// Those keys should be written down (copied)
// [X] I want this storage to be accessible remotely

// In case of pairing,
// that secret key should be stored in localStorage

// secret cannot be used directly!
// we can use secret to put a signed message for every request

// Multiple storages? Multiple pairing keys + addresses
// masterwallet_pairing variable is a JSON
// Should the same pairing be in the plugin? who knows..

// PAIR = (PUBLIC, SECRET, URL)

// Dummy page for the api
app.get('/', (req, res, next) => {
    res.sendFile(__dirname + '/index.html');
});

if (require.main === module) {
  const { host, port } = options;
  console.log("app listening on %s:%d ", host, port);
  app.listen(port, host);

} else {
  module.exports = app;
}
