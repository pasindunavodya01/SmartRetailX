const express = require('express');

const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const {
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
} = require('../controllers/product-inventory.controller');

const router = express.Router();

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: List all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 */
router.get('/products', authenticate, listProducts);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create a product (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Product created
 */
router.post('/products', authenticate, authorize('ADMIN'), createProduct);

/**
 * @swagger
 * /api/v1/products/sku/{sku}:
 *   get:
 *     summary: Get a product by SKU
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sku
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/products/sku/:sku', authenticate, getProductBySku);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 */
router.get('/products/:id', authenticate, getProductById);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Update a product (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put('/products/:id', authenticate, authorize('ADMIN'), updateProduct);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Delete a product (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Product deleted
 */
router.delete('/products/:id', authenticate, authorize('ADMIN'), deleteProduct);

/**
 * @swagger
 * /api/v1/inventory:
 *   get:
 *     summary: Get inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory details
 */
router.get('/inventory', authenticate, getInventory);

/**
 * @swagger
 * /api/v1/inventory/adjust:
 *   post:
 *     summary: Adjust inventory (Admin)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory adjusted
 */
router.post('/inventory/adjust', authenticate, authorize('ADMIN'), adjustInventory);

/**
 * @swagger
 * /api/v1/inventory/consume:
 *   post:
 *     summary: Consume inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory consumed
 */
router.post('/inventory/consume', authenticate, consumeInventory);

/**
 * @swagger
 * /api/v1/inventory/release:
 *   post:
 *     summary: Release inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory released
 */
router.post('/inventory/release', authenticate, releaseInventory);

module.exports = router;
