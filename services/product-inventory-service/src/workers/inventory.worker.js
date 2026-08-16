const { Consumer } = require('sqs-consumer');
const { SQSClient } = require('@aws-sdk/client-sqs');
const prisma = require('../config/prisma');

const SQS_QUEUE_URL = process.env.SQS_INVENTORY_QUEUE_URL;

const sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });

const isUniqueConstraintError = (error) => error?.code === 'P2002';

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

                // SQS delivers messages at least once. SNS's MessageId stays stable across
                // redeliveries, unlike SQS's receipt/message IDs.
                const eventId = snsBody.MessageId;
                if (!eventId) {
                    throw new Error('SNS MessageId is required for inventory event processing');
                }

                if (!['OrderPlaced', 'OrderCancelled'].includes(eventType)) {
                    console.log(`Ignored eventType: ${eventType}`);
                    return;
                }

                try {
                    await prisma.$transaction(async (tx) => {
                        // Create the idempotency record first. A duplicate causes the whole
                        // transaction to roll back before any stock can be changed.
                        await tx.processedInventoryEvent.create({
                            data: { eventId, orderId: data.id, eventType }
                        });

                        for (const item of data.items || []) {
                            const sku = item.productId;
                            const quantity = Number(item.quantity);
                            if (!sku || !Number.isInteger(quantity) || quantity <= 0) {
                                throw new Error(`Invalid inventory item in order ${data.id}`);
                            }

                            if (eventType === 'OrderPlaced') {
                                const result = await tx.inventoryItem.updateMany({
                                    where: { sku, stock: { gte: quantity } },
                                    data: { stock: { decrement: quantity } }
                                });

                                if (result.count === 0) {
                                    throw new Error(`Insufficient stock for ${sku}`);
                                }
                            } else {
                                await tx.inventoryItem.update({
                                    where: { sku },
                                    data: { stock: { increment: quantity } }
                                });
                            }
                        }
                    });
                    console.log(`Processed ${eventType} for order ${data.id}`);
                } catch (error) {
                    if (isUniqueConstraintError(error)) {
                        console.log(`Skipped duplicate inventory event ${eventId}`);
                        return;
                    }
                    throw error;
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
