const express = require('express');
const cors = require('cors');
const AWSXRay = require('aws-xray-sdk');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger');

const orderRoutes = require('./routes/order.routes');

const app = express();

// Task 7: Distributed Tracing using AWS X-Ray (Start Segment)
app.use(AWSXRay.express.openSegment('OrderService'));

app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'order-service'
    });
});

app.use('/api/v1/orders/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/v1/orders', orderRoutes);

// Task 7: Distributed Tracing using AWS X-Ray (Close Segment)
app.use(AWSXRay.express.closeSegment());

module.exports = app;
