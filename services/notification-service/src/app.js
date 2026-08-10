const express = require('express');
const cors = require('cors');

const notificationRoutes = require('./routes/notification.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'notification-service'
    });
});

app.use('/api/v1/notifications', notificationRoutes);

module.exports = app;
