require('dotenv').config();

const app = require('./app');
const { startNotificationWorker } = require('./workers/notification.worker');

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`Notification Service running on port ${PORT}`);
    startNotificationWorker();
});
