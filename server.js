const http = require("http");
const express = require("express");
const program = require('commander');
const bodyParser = require('body-parser');

program
    .option('--cors', 'Enable CORS', false)
    .option('-h, --host [host]', 'Bind to address (127.0.0.1 by default)')
    .option('-p, --port [port]', 'Port to be launched (7773  by default)')
    .option('-v, --verbose', 'Increase verbosity', true, 40)
    .parse(process.argv);

console.log(program.host, program.port, program.cors);
process.exit(0);

const host = program.host || "127.0.0.1";
const port = program.port || 7773;

const app = express();
app.use(bodyParser.json());

if (program.cors) {
  app.use(require('cors')());
}

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

console.log("app listening on %s:%d ", host, port);
app.listen(port, host);


