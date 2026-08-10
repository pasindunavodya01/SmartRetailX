const express = require('express');
const cors = require('cors');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');

const productInventoryRoutes = require('./routes/product-inventory.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'product-inventory-service'
    });
});

app.use('/api/v1', productInventoryRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = app;
