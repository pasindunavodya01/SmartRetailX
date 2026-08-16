require('dotenv').config();

const app = require('./app');
const { startInventoryWorker } = require('./workers/inventory.worker');

const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3004;

const server = http.createServer(app);
const io = new Server(server, {
    path: '/api/v1/products/socket.io/',
    cors: {
        origin: '*'
    }
});

io.on('connection', (socket) => {
    console.log('Client connected to WebSocket:', socket.id);
});

// Attach io to app so controllers can use it
app.set('io', io);

server.listen(PORT, () => {
    console.log(`Product Inventory Service running on port ${PORT}`);
    startInventoryWorker();
});
