const prisma = require('../config/prisma');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const normalizeStatus = (status) => {
    const value = (status || 'PENDING').toUpperCase();
    const allowedStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    return allowedStatuses.includes(value) ? value : 'PENDING';
};

// Initialize AWS SNS Client
// It automatically picks up AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY from the environment
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const SNS_TOPIC_ARN = process.env.SNS_ORDER_EVENTS_TOPIC_ARN; 

const publishOrderEvent = async (eventType, orderData) => {
    if (!SNS_TOPIC_ARN) {
        console.warn('SNS_ORDER_EVENTS_TOPIC_ARN is not set. Skipping event publish.');
        return;
    }

    try {
        const command = new PublishCommand({
            TopicArn: SNS_TOPIC_ARN,
            Message: JSON.stringify({
                eventType,
                timestamp: new Date().toISOString(),
                data: orderData
            }),
            MessageAttributes: {
                eventType: {
                    DataType: 'String',
                    StringValue: eventType
                }
            }
        });
        const response = await snsClient.send(command);
        console.log(`Successfully published ${eventType} to SNS. MessageId: ${response.MessageId}`);
    } catch (error) {
        console.error(`Failed to publish ${eventType} to SNS`, error);
        // In a production system, you would save this to a dead-letter queue or retry mechanism
    }
};

const listOrders = async (req, res) => {
    try {
        const where = req.user?.role === 'ADMIN'
            ? {}
            : { customerId: req.user?.sub || '' };

        const orders = await prisma.order.findMany({
            where,
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ items: orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const createOrder = async (req, res) => {
    try {
        const { items } = req.body;
        let customerId = req.user?.sub;

        if (req.user?.role === 'ADMIN' && req.body.customerId) {
            customerId = req.body.customerId;
        }

        if (!customerId || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Customer ID and at least one item are required'
            });
        }

        // Validate items basic structure
        const validatedItems = [];
        for (const item of items) {
            const sku = item.sku || item.productId;
            const quantity = Number(item.quantity || 1);
            if (!sku || !quantity) {
                return res.status(400).json({ message: 'Each item needs a SKU and quantity' });
            }
            validatedItems.push({
                productId: sku, 
                quantity,
                price: Number(item.price || 0)
            });
        }

        // Save order immediately as PENDING (Eventual Consistency)
        const order = await prisma.order.create({
            data: {
                customerId,
                createdBy: req.user?.sub || null,
                status: 'PENDING',
                items: {
                    create: validatedItems
                }
            },
            include: { items: true }
        });

        // Publish OrderPlaced event to SNS
        await publishOrderEvent('OrderPlaced', order);

        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: { items: true }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (req.user?.role !== 'ADMIN' && order.customerId !== req.user?.sub) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateOrder = async (req, res) => {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only admins can update order details' });
        }

        const { customerId } = req.body;
        const data = {};

        if (customerId) data.customerId = customerId;

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ message: 'No valid update fields provided (use /status for status updates)' });
        }

        const order = await prisma.order.update({
            where: { id: req.params.id },
            data,
            include: { items: true }
        });

        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const normalizedStatus = normalizeStatus(status);
        const currentOrder = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: { items: true }
        });

        if (!currentOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (req.user?.role !== 'ADMIN') {
            if (currentOrder.customerId !== req.user?.sub) {
                return res.status(403).json({ message: 'Access denied' });
            }
            if (normalizedStatus !== 'CANCELLED') {
                return res.status(403).json({ message: 'Customers can only cancel orders' });
            }
        }

        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { status: normalizedStatus },
            include: { items: true }
        });

        // Publish OrderCancelled event if status changes to CANCELLED
        if (normalizedStatus === 'CANCELLED' && currentOrder.status !== 'CANCELLED') {
            await publishOrderEvent('OrderCancelled', order);
        }

        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const simulateDeliveryUpdate = async (req, res) => {
    try {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Only admins can simulate delivery updates' });
        }

        const { trackingStatus } = req.body;
        if (!trackingStatus) {
            return res.status(400).json({ message: 'trackingStatus is required' });
        }

        const currentOrder = await prisma.order.findUnique({
            where: { id: req.params.id }
        });

        if (!currentOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Publish DeliveryUpdate event to SNS
        await publishOrderEvent('DeliveryUpdate', {
            id: currentOrder.id,
            customerId: currentOrder.customerId,
            trackingStatus
        });

        res.status(200).json({ message: `Delivery update '${trackingStatus}' sent successfully for order ${currentOrder.id}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    listOrders,
    createOrder,
    getOrderById,
    updateOrder,
    updateOrderStatus,
    simulateDeliveryUpdate
};
