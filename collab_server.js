const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());

let ignoreChanges = false;

io.on('connection', (socket) => {
  console.log('User connected');


  socket.on('editorChange', (editorValue) => {
    if (ignoreChanges) return;
    
    ignoreChanges = true;
    setTimeout(() => {
      ignoreChanges = false;
    }, 2000);

    socket.broadcast.emit('updateEditor', editorValue);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
