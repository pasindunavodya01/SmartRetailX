const express = require('express');

const authenticate = require('../middleware/auth.middleware');

const {
    getCurrentUser
} = require('../controllers/user.controller');

const router = express.Router();

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 */
router.get('/me', authenticate, getCurrentUser);

module.exports = router;