const { Consumer } = require('sqs-consumer');
const { SQSClient } = require('@aws-sdk/client-sqs');
const prisma = require('../config/prisma');

const SQS_QUEUE_URL = process.env.SQS_INVENTORY_QUEUE_URL;

const sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });

const startInventoryWorker = () => {
    if (!SQS_QUEUE_URL) {
        console.warn('SQS_INVENTORY_QUEUE_URL is not set. Worker is disabled.');
        return;
    }

    const app = Consumer.create({
        queueUrl: SQS_QUEUE_URL,
        sqs: sqsClient,
        handleMessage: async (message) => {
            console.log('Received message:', message.Body);
            try {
                // SNS wraps the message in a JSON object with a "Message" field
                const snsBody = JSON.parse(message.Body);
                const eventPayload = JSON.parse(snsBody.Message);

                const { eventType, data } = eventPayload;

                if (eventType === 'OrderPlaced') {
                    console.log(`Processing OrderPlaced for order ${data.id}`);
                    for (const item of data.items) {
                        const sku = item.productId; 
                        const quantity = item.quantity;
                        
                        // Deduct stock
                        const result = await prisma.inventoryItem.updateMany({
                            where: { sku, stock: { gte: quantity } },
                            data: { stock: { decrement: quantity } }
                        });
                        
                        if (result.count === 0) {
                            console.error(`Insufficient stock for ${sku}. Needs Saga rollback handling in real app.`);
                            // In a full implementation, you would publish an 'InventoryFailed' event here.
                        } else {
                            console.log(`Decremented ${quantity} from SKU ${sku}`);
                        }
                    }
                } else if (eventType === 'OrderCancelled') {
                    console.log(`Processing OrderCancelled for order ${data.id}`);
                    for (const item of data.items) {
                        const sku = item.productId;
                        const quantity = item.quantity;
                        
                        await prisma.inventoryItem.update({
                            where: { sku },
                            data: { stock: { increment: quantity } }
                        });
                        console.log(`Incremented ${quantity} back to SKU ${sku}`);
                    }
                } else {
                    console.log(`Ignored eventType: ${eventType}`);
                }
            } catch (error) {
                console.error('Error processing SQS message:', error);
                throw error; // Throwing error puts it back on the queue or DLQ
            }
        }
    });

    app.on('error', (err) => {
        console.error(err.message);
    });

    app.on('processing_error', (err) => {
        console.error(err.message);
    });

    console.log('Starting Inventory SQS Worker...');
    app.start();
};

module.exports = { startInventoryWorker };
