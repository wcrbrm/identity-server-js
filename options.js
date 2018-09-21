const homedir = require('os').homedir();

if (process.versions.hasOwnProperty('electron')) {

  const host = "127.0.0.1";
  const port = 7773;
  const verbose = true;
  const cors = true;
  const storage = `${homedir}/.MasterWallet`;
  const debug = process.env.RELEASE ? false : true;
  module.exports = { host, port, verbose, cors, storage, debug };

} else {
  const program = require('commander');
 
  // TODO: include options for http proxy support
  program
    .option('--cors', 'Enable CORS', false)
    .option('-d, --storage [storage]', 'Provide storage folder location')
    .option('-h, --host [host]', 'Bind to address (127.0.0.1 by default)')
    .option('-p, --port [port]', 'Port to be launched (7773  by default)')
    .option('-v, --verbose', 'Increase verbosity', true, 40)
    .parse(process.argv);

  const { verbose, cors } = program;
  const host = program.host || "127.0.0.1";
  const port = program.port || 7773;
  const storage = program.storage || `${homedir}/.MasterWallet`;
  module.exports = { host, port, verbose, cors, storage };
}
