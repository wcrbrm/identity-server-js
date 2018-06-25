const http = require("http");
const express = require("express");
const bodyParser = require('body-parser');
const options = require('./options');

const app = express();
app.use(bodyParser.json());

if (options.cors) {
  app.use(require('cors')());
}

app.get('/api/status', require('./api/status')(options));

/*

API of the interface:
  POST /:network/create
  GET /:network/import/options
  POST /:network/import
  POST /wallets
  GET /wallets - get current wallets
  POST /exchanges
  GET /wallets
  GET /settings
  PUT /settings
  GET /:network/vote
  POST /:network/vote

*/

// Dummy page for the api
app.get('/', (req, res, next) => {
    res.sendFile(__dirname + '/index.html');
});

const { host, port } = options;
console.log("app listening on %s:%d ", host, port);
app.listen(port, host);


