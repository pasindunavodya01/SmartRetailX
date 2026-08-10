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

router.get('/products', authenticate, listProducts);
router.post('/products', authenticate, authorize('ADMIN'), createProduct);
router.get('/products/sku/:sku', authenticate, getProductBySku);
router.get('/products/:id', authenticate, getProductById);
router.put('/products/:id', authenticate, authorize('ADMIN'), updateProduct);
router.delete('/products/:id', authenticate, authorize('ADMIN'), deleteProduct);
router.get('/inventory', authenticate, getInventory);
router.post('/inventory/adjust', authenticate, authorize('ADMIN'), adjustInventory);
router.post('/inventory/consume', authenticate, consumeInventory);
router.post('/inventory/release', authenticate, releaseInventory);

module.exports = router;
