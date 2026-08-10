const express = require('express');

const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

const {
    getAdminDashboard
} = require('../controllers/admin.controller');

const router = express.Router();

router.get(
    '/dashboard',
    authenticate,
    authorize('ADMIN'),
    getAdminDashboard
);

module.exports = router;