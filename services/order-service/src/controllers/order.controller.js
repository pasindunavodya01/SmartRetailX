const prisma = require('../config/prisma');

const normalizeStatus = (status) => {
    const value = (status || 'PENDING').toUpperCase();
    const allowedStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    return allowedStatuses.includes(value) ? value : 'PENDING';
};

const PRODUCT_INVENTORY_SERVICE_URL = process.env.PRODUCT_INVENTORY_SERVICE_URL || 'http://localhost:3004';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3002';

const consumeInventory = async (sku, quantity) => {
    const response = await fetch(`${PRODUCT_INVENTORY_SERVICE_URL}/api/v1/internal/inventory/consume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, quantity })
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Inventory service error: ${response.status} ${body}`);
    }

    return response.json();
};

const releaseInventory = async (sku, quantity) => {
    const response = await fetch(`${PRODUCT_INVENTORY_SERVICE_URL}/api/v1/internal/inventory/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, quantity })
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Inventory service error: ${response.status} ${body}`);
    }

    return response.json();
};

const notifyCustomer = async (userId, message, type = 'INFO') => {
    try {
        await fetch(`${NOTIFICATION_SERVICE_URL}/api/v1/internal/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, message, type })
        });
    } catch (error) {
        console.error('Notification dispatch failed', error);
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

        const consumedItems = [];

        try {
            for (const item of items) {
                const sku = item.sku || item.productId;
                const quantity = Number(item.quantity || 1);

                if (!sku || !quantity) {
                    throw new Error('Each item needs a SKU and quantity');
                }

                const inventoryResult = await consumeInventory(sku, quantity);
                consumedItems.push({
                    sku,
                    productId: inventoryResult.productId,
                    quantity,
                    price: Number(item.price || 0)
                });
            }
        } catch (error) {
            for (const consumedItem of consumedItems) {
                await releaseInventory(consumedItem.sku, consumedItem.quantity);
            }

            return res.status(409).json({
                message: 'Inventory is insufficient for one or more items'
            });
        }

        const order = await prisma.order.create({
            data: {
                customerId,
                createdBy: req.user?.sub || null,
                status: 'PENDING',
                items: {
                    create: consumedItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            },
            include: { items: true }
        });

        await notifyCustomer(customerId, `Order ${order.id} created successfully.`, 'INFO');

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

        if (normalizedStatus === 'CANCELLED' && currentOrder.status !== 'CANCELLED') {
            for (const item of currentOrder.items) {
                const response = await fetch(`${PRODUCT_INVENTORY_SERVICE_URL}/api/v1/products/${item.productId}`);
                if (response.ok) {
                    const product = await response.json();
                    await releaseInventory(product.sku, item.quantity);
                }
            }
        }

        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { status: normalizedStatus },
            include: { items: true }
        });

        res.status(200).json(order);
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
    updateOrderStatus
};
