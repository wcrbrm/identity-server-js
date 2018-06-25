if (process.versions.hasOwnProperty('electron')) {

  module.exports = {
  };

} else {
  const homedir = require('os').homedir();
  const program = require('commander');
  program
    .option('--cors', 'Enable CORS', false)
    .option('-f, --storage [storage]', 'Sceipfiy storage location')
    .option('-h, --host [host]', 'Bind to address (127.0.0.1 by default)')
    .option('-p, --port [port]', 'Port to be launched (7773  by default)')
    .option('-v, --verbose', 'Increase verbosity', true, 40)
    .parse(process.argv);

  const { verbose, cors } = program;
  const host = program.host || "127.0.0.1";
  const port = program.port || 7773;
  const storage = program.storage || `${homedir}/.MasterWallet/encrypted.storage`;
  module.exports = { host, port, verbose, cors, storage };
}