const express = require('express');
const cors = require('cors');

const orderRoutes = require('./routes/order.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'order-service'
    });
});

app.use('/api/v1/orders', orderRoutes);

module.exports = app;
