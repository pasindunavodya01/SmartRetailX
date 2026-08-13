require('dotenv').config();

const app = require('./app');
const { startInventoryWorker } = require('./workers/inventory.worker');

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
    console.log(`Product Inventory Service running on port ${PORT}`);
    startInventoryWorker();
});
