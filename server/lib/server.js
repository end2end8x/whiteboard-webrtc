const server = require('http').createServer();
const socket = require('./socket');

module.exports.run = (config) => {
  server.listen(config.PORT);
  socket(server);
  console.log(`Server is listening PORT ${config.PORT}`);
};