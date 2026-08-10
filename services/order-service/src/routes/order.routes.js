const express = require('express');

const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const {
    listOrders,
    createOrder,
    getOrderById,
    updateOrder,
    updateOrderStatus,
    deleteOrder
} = require('../controllers/order.controller');

const router = express.Router();

router.get('/', authenticate, listOrders);
router.post('/', authenticate, createOrder);
router.get('/:id', authenticate, getOrderById);
router.put('/:id', authenticate, updateOrder);
router.patch('/:id/status', authenticate, authorize('ADMIN'), updateOrderStatus);
router.delete('/:id', authenticate, deleteOrder);

module.exports = router;
