var io = require('socket.io');

function initSocket(socket) {
  let id = socket.id;
  socket
    .on('init', () => {
      socket.emit('init', { id });
    })
    .on('request', (data) => {
      const buddy = io.sockets.connected[data.to];
      if (buddy) {
        buddy.emit('request', { from: id });
      }
    })
    .on('call', (data) => {
      const buddy = io.sockets.connected[data.to];
      if (buddy) {
        buddy.emit('call', { ...data, from: id });
      } else {
        socket.emit('failed');
      }
    })
    .on('end', (data) => {
      const buddy = io.sockets.connected[data.to];
      if (buddy) {
        buddy.emit('end');
      }
    })
    .on('disconnect', () => {
      console.log(id, 'disconnected');
    });
};

module.exports = (server) => {
  io = io.listen(server)
  io.on('connection', initSocket);
};