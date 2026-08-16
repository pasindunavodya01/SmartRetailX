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
    
    // Simulate real-time promotions every 30 seconds
    setInterval(() => {
        const discount = Math.floor(Math.random() * 20) + 10;
        io.emit('promotion', { message: `FLASH SALE! ${discount}% OFF all items for the next 5 minutes!` });
    }, 30000);
});
