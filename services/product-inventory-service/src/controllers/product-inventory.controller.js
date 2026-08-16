const prisma = require('../config/prisma');

const getActivePromotion = () => prisma.promotion.findFirst({
    where: { active: true },
    orderBy: { createdAt: 'desc' }
});

const promotionResponse = (promotion) => promotion && {
    id: promotion.id,
    discountPercentage: promotion.discountPercentage,
    createdAt: promotion.createdAt
};

const presentProduct = (product, promotion) => {
    if (!promotion) return product;

    const basePrice = Number(product.price);
    return {
        ...product,
        price: Number((basePrice * (1 - promotion.discountPercentage / 100)).toFixed(2)),
        originalPrice: basePrice,
        promotion: promotionResponse(promotion)
    };
};

const listProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: { inventory: true },
            orderBy: { createdAt: 'desc' }
        });

        const promotion = await getActivePromotion();
        res.status(200).json({
            items: products.map((product) => presentProduct(product, promotion)),
            promotion: promotionResponse(promotion)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { sku, name, description, category, price } = req.body;

        if (!sku || !name || price === undefined || isNaN(Number(price)) || Number(price) <= 0) {
            return res.status(400).json({
                message: 'SKU, name, and a valid positive price are required'
            });
        }

        const product = await prisma.product.create({
            data: {
                sku,
                name,
                description: typeof description === 'string' ? description : null,
                category: typeof category === 'string' ? category : null,
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

        res.status(200).json(presentProduct(product, await getActivePromotion()));
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

        res.status(200).json(presentProduct(product, await getActivePromotion()));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { sku, name, description, category, price } = req.body;
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
        if (description !== undefined) {
            if (description !== null && typeof description !== 'string') {
                return res.status(400).json({ message: 'Description must be a string' });
            }
            data.description = description;
        }
        if (category !== undefined) {
            if (category !== null && typeof category !== 'string') {
                return res.status(400).json({ message: 'Category must be a string' });
            }
            data.category = category;
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

        if (!sku || !Number.isInteger(quantity) || quantity === 0) {
            return res.status(400).json({
                message: 'SKU and a non-zero integer quantity are required'
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

        if (stockItem.stock + quantity < 0) {
            return res.status(409).json({ message: 'Inventory cannot be negative' });
        }

        const updatedInventory = await prisma.inventoryItem.update({
            where: { sku },
            data: { stock: { increment: quantity } },
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

const applyPromotion = async (req, res) => {
    try {
        const { discountPercentage } = req.body;

        if (!Number.isInteger(discountPercentage) || discountPercentage <= 0 || discountPercentage >= 100) {
            return res.status(400).json({ message: 'Valid discountPercentage (1-99) is required' });
        }

        const existingPromotion = await getActivePromotion();
        if (existingPromotion) {
            return res.status(409).json({
                message: 'An active promotion already exists. End it before launching another.'
            });
        }

        // Product prices are intentionally left untouched. The active promotion is
        // applied when products are read, so ending it immediately restores prices.
        const promotion = await prisma.promotion.create({
            data: { discountPercentage }
        });

        // Emit Socket.io event to all connected clients
        const io = req.app.get('io');
        if (io) {
            io.emit('promotion', { 
                message: `${discountPercentage}% OFF all items`,
                type: 'DISCOUNT',
                promotion: promotionResponse(promotion)
            });
        }

        res.status(201).json({
            message: `Promotion of ${discountPercentage}% launched`,
            promotion: promotionResponse(promotion)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const endPromotion = async (req, res) => {
    try {
        const promotion = await prisma.promotion.findUnique({ where: { id: req.params.id } });
        if (!promotion || !promotion.active) {
            return res.status(404).json({ message: 'Active promotion not found' });
        }

        const endedPromotion = await prisma.promotion.update({
            where: { id: promotion.id },
            data: { active: false, endedAt: new Date() }
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('promotion', { type: 'PROMOTION_ENDED', promotionId: endedPromotion.id });
        }

        res.status(200).json({ message: 'Promotion ended', promotion: promotionResponse(endedPromotion) });
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
    releaseInventory,
    applyPromotion,
    endPromotion
};
