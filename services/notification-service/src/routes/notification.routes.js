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

router.post('/internal', createInternalNotification);
router.get('/users/:userId', authenticate, getNotificationsByUser);
router.get('/', authenticate, listNotifications);
router.post('/', authenticate, authorize('ADMIN'), createNotification);
router.get('/:id', authenticate, getNotificationById);
router.patch('/:id/read', authenticate, markNotificationRead);
router.put('/:id', authenticate, authorize('ADMIN'), updateNotification);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteNotification);

module.exports = router;
