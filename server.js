const http = require("http");
const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');

const port = process.env.PORT || 7773;
const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/api/status', require('./api/status'));

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

console.log("app listening on %d ", port);
app.listen(port, "127.0.0.1");


