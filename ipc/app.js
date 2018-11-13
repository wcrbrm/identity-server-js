const { ipcMain } = require('electron');
const fs = require('fs');
const debug = require('debug')('app.ipc');
const { error, ok, body } = require("./../services/express-util")('app.ipc');

class IPCResponse {
  constructor ({ event, channel, params }) {
    this.event = event;
    this.params = params;
    this.headers = {};

    this.json = (obj) => {
      obj.params = this.params;
      this.event.sender.send(channel, JSON.stringify(obj));
      return this;
    };

    this.status = (code) => {
      this.statusCode = code;
      return this;
    };

    this.send = (fileBuffer) => {
      const encoding = this.params.encoding || 'utf8';
      this.event.sender.send(channel, fileBuffer.toString(encoding));
      return this;
    };

    this.setHeader = (header, value) => {
      this.headers[header] = value;
    };

    this.sendFile = (path) => {
      fs.readFile(path, (err, fileBuffer) => {
        const encoding = this.params.encoding || 'utf8';
        this.event.sender.send(channel, fileBuffer.toString(encoding));
      });
      return this;
    };
  }
};

class IPCApp {
  constructor () {
    this.stack = [];

    this.use = (middleware) => {
      if (typeof middleware === 'function') {
        this.stack.push(middleware);
      }
    };

    this.handle = ({ req, res, callback, stack }) => {
      let idx = 0;
      const next = () => {
        if (idx >= stack.length) {
          return setImmediate(() => callback(req, res, next));
        }
        const layer = stack[idx++];
        setImmediate(() => {
          try {
            layer(req, res, next);
          } catch(error) {
            next(error);
          }
        });
      };
      next();
    };

    this.request = ({ method, path, callback }) => {
      const channel = `${method} ${path}`;
      const stack = this.stack.slice();
      ipcMain.on(channel, (event, args) => {
        debug(channel, args);
        const req = Object.assign({}, args);
        req.body = body(req);
        req.path = path;
        const res = new IPCResponse({ event, channel, params: req.params });
        this.handle({ req, res, callback, stack });
      });
    };

    this.get = (path, callback) => {
      this.request({ method: 'GET', path, callback });
    };
    
    this.post = (path, callback) => {
      this.request({ method: 'POST', path, callback });
    };
  
    this.delete = (path, callback) => {
      this.request({ method: 'DELETE', path, callback });
    };

    this.listen = () => {
      // Empty method for compatibility with Express only
    };

  }
};

module.exports = IPCApp;