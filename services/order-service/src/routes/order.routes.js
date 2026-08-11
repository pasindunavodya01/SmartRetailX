const express = require('express');

const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const {
    listOrders,
    createOrder,
    getOrderById,
    updateOrder,
    updateOrderStatus
} = require('../controllers/order.controller');

const router = express.Router();

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: List all orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', authenticate, listOrders);

/**
 * @swagger
 * /api/v1/orders:
 *   post:
 *     summary: Create an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order created
 */
router.post('/', authenticate, createOrder);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
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
 *         description: Order details
 */
router.get('/:id', authenticate, getOrderById);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   put:
 *     summary: Update an order
 *     tags: [Orders]
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
 *         description: Order updated
 */
router.put('/:id', authenticate, updateOrder);

/**
 * @swagger
 * /api/v1/orders/{id}/status:
 *   patch:
 *     summary: Update order status (Admin) or Cancel (Customer)
 *     tags: [Orders]
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
 *         description: Order status updated
 */
router.patch('/:id/status', authenticate, updateOrderStatus);



module.exports = router;
