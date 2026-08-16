const { Consumer } = require('sqs-consumer');
const { SQSClient } = require('@aws-sdk/client-sqs');
const prisma = require('../config/prisma');

const SQS_QUEUE_URL = process.env.SQS_NOTIFICATION_QUEUE_URL;

const sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });

const isUniqueConstraintError = (error) => error?.code === 'P2002';

const startNotificationWorker = () => {
    if (!SQS_QUEUE_URL) {
        console.warn('SQS_NOTIFICATION_QUEUE_URL is not set. Worker is disabled.');
        return;
    }

    const app = Consumer.create({
        queueUrl: SQS_QUEUE_URL,
        sqs: sqsClient,
        handleMessage: async (message) => {
            console.log('Received notification message:', message.Body);
            try {
                const snsBody = JSON.parse(message.Body);
                const eventPayload = JSON.parse(snsBody.Message);

                const { eventType, data } = eventPayload;
                const sourceEventId = snsBody.MessageId;
                if (!sourceEventId) {
                    throw new Error('SNS MessageId is required for notification processing');
                }
                const customerId = data.customerId;

                if (!customerId) {
                    console.log('Skipping notification: No customerId provided in event data.');
                    return;
                }

                let notificationMessage = '';
                let type = 'INFO';

                if (eventType === 'OrderPlaced') {
                    notificationMessage = `Your order ${data.id} has been placed successfully and is PENDING.`;
                } else if (eventType === 'OrderCancelled') {
                    notificationMessage = `Your order ${data.id} has been CANCELLED.`;
                } else if (eventType === 'DeliveryUpdate') {
                    notificationMessage = `Delivery Update for Order ${data.id}: ${data.trackingStatus}`;
                    type = 'DELIVERY';
                } else {
                    console.log(`Ignored eventType: ${eventType}`);
                    return;
                }

                try {
                    await prisma.notification.create({
                        data: {
                            userId: customerId,
                            message: notificationMessage,
                            type,
                            isRead: false,
                            sourceEventId
                        }
                    });
                } catch (error) {
                    if (isUniqueConstraintError(error)) {
                        console.log(`Skipped duplicate notification event ${sourceEventId}`);
                        return;
                    }
                    throw error;
                }

                console.log(`Notification saved and sent to user ${customerId}: ${notificationMessage}`);
            } catch (error) {
                console.error('Error processing SQS message:', error);
                throw error; 
            }
        }
    });

    app.on('error', (err) => {
        console.error(err.message);
    });

    app.on('processing_error', (err) => {
        console.error(err.message);
    });

    console.log('Starting Notification SQS Worker...');
    app.start();
};

module.exports = { startNotificationWorker };
