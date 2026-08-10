const express = require('express');

const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const {
    listNotifications,
    createNotification,
    createInternalNotification,
    getNotificationsByUser,
    getNotificationById,
    markNotificationRead,
    updateNotification,
    deleteNotification
} = require('../controllers/notification.controller');

const router = express.Router();

/**
 * @swagger
 * /api/v1/notifications/internal:
 *   post:
 *     summary: Create an internal notification
 *     tags: [Notifications]
 *     responses:
 *       201:
 *         description: Notification created
 */
router.post('/internal', createInternalNotification);

/**
 * @swagger
 * /api/v1/notifications/users/{userId}:
 *   get:
 *     summary: Get notifications for a user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/users/:userId', authenticate, getNotificationsByUser);

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: List all notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', authenticate, listNotifications);

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: Create a notification (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Notification created
 */
router.post('/', authenticate, authorize('ADMIN'), createNotification);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   get:
 *     summary: Get a notification by ID
 *     tags: [Notifications]
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
 *         description: Notification details
 */
router.get('/:id', authenticate, getNotificationById);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
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
 *         description: Notification updated
 */
router.patch('/:id/read', authenticate, markNotificationRead);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   put:
 *     summary: Update a notification (Admin)
 *     tags: [Notifications]
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
 *         description: Notification updated
 */
router.put('/:id', authenticate, authorize('ADMIN'), updateNotification);

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Delete a notification (Admin)
 *     tags: [Notifications]
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
 *         description: Notification deleted
 */
router.delete('/:id', authenticate, authorize('ADMIN'), deleteNotification);

module.exports = router;
