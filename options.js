if (process.versions.hasOwnProperty('electron')) {

  // TODO: electron application should read configation file for server parameters
  module.exports = {
  };

} else {
  const homedir = require('os').homedir();
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
