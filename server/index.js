const server = require('./lib/server');

var config = {}
config.PORT = process.env.PORT || 8000;

server.run(config);