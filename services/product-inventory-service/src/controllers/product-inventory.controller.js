const prisma = require('../config/prisma');

const listProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: { inventory: true },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ items: products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { sku, name, price } = req.body;

        if (!sku || !name || price === undefined || isNaN(Number(price)) || Number(price) <= 0) {
            return res.status(400).json({
                message: 'SKU, name, and a valid positive price are required'
            });
        }

        const product = await prisma.product.create({
            data: {
                sku,
                name,
                price: Number(price),
                inventory: {
                    create: {
                        sku,
                        stock: 0
                    }
                }
            },
            include: { inventory: true }
        });

        res.status(201).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: { inventory: true }
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getProductBySku = async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { sku: req.params.sku },
            include: { inventory: true }
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { sku, name, price } = req.body;
        const data = {};

        if (sku !== undefined) {
            if (typeof sku !== 'string' || sku.trim() === '') {
                return res.status(400).json({ message: 'SKU cannot be empty' });
            }
            data.sku = sku;
        }
        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim() === '') {
                return res.status(400).json({ message: 'Name cannot be empty' });
            }
            data.name = name;
        }
        if (price !== undefined) {
            const numericPrice = Number(price);
            if (isNaN(numericPrice) || numericPrice <= 0) {
                return res.status(400).json({ message: 'Price must be a positive number' });
            }
            data.price = numericPrice;
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ message: 'No update fields provided' });
        }

        const product = await prisma.product.update({
            where: { id: req.params.id },
            data,
            include: { inventory: true }
        });

        res.status(200).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        await prisma.$transaction([
            prisma.inventoryItem.deleteMany({ where: { productId: req.params.id } }),
            prisma.product.delete({ where: { id: req.params.id } })
        ]);

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getInventory = async (req, res) => {
    try {
        const inventory = await prisma.inventoryItem.findMany({
            include: { product: true },
            orderBy: { sku: 'asc' }
        });

        res.status(200).json({ items: inventory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const adjustInventory = async (req, res) => {
    try {
        const { sku, quantity } = req.body;

        if (!sku || typeof quantity !== 'number') {
            return res.status(400).json({
                message: 'SKU and quantity are required'
            });
        }

        const stockItem = await prisma.inventoryItem.findUnique({
            where: { sku },
            include: { product: true }
        });

        if (!stockItem) {
            return res.status(404).json({
                message: 'Inventory entry not found'
            });
        }

        const updatedInventory = await prisma.inventoryItem.update({
            where: { sku },
            data: { stock: stockItem.stock + quantity },
            include: { product: true }
        });

        res.status(200).json(updatedInventory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const consumeInventory = async (req, res) => {
    try {
        const { sku, quantity } = req.body;

        if (!sku || typeof quantity !== 'number' || quantity <= 0) {
            return res.status(400).json({ message: 'SKU and a positive quantity are required' });
        }

        const result = await prisma.inventoryItem.updateMany({
            where: { sku, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } }
        });

        if (result.count === 0) {
            const exists = await prisma.inventoryItem.findUnique({ where: { sku } });
            if (!exists) {
                return res.status(404).json({ message: 'Inventory entry not found' });
            }
            return res.status(409).json({ message: 'Insufficient stock' });
        }

        const updatedInventory = await prisma.inventoryItem.findUnique({
            where: { sku },
            include: { product: true }
        });

        res.status(200).json({
            sku: updatedInventory.sku,
            stock: updatedInventory.stock,
            productId: updatedInventory.product.id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const releaseInventory = async (req, res) => {
    try {
        const { sku, quantity } = req.body;

        if (!sku || typeof quantity !== 'number' || quantity <= 0) {
            return res.status(400).json({ message: 'SKU and a positive quantity are required' });
        }

        const stockItem = await prisma.inventoryItem.findUnique({ where: { sku } });

        if (!stockItem) {
            return res.status(404).json({ message: 'Inventory entry not found' });
        }

        const updatedInventory = await prisma.inventoryItem.update({
            where: { sku },
            data: { stock: { increment: quantity } }
        });

        res.status(200).json(updatedInventory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    listProducts,
    createProduct,
    getProductById,
    getProductBySku,
    updateProduct,
    deleteProduct,
    getInventory,
    adjustInventory,
    consumeInventory,
    releaseInventory
};
