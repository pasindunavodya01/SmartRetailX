const prisma = require('../config/prisma');

const normalizeType = (type) => {
    const value = (type || 'INFO').toUpperCase();
    const allowedTypes = ['INFO', 'WARNING', 'SUCCESS', 'ERROR'];
    return allowedTypes.includes(value) ? value : 'INFO';
};

const listNotifications = async (req, res) => {
    try {
        const userId = req.query.userId || req.params?.userId;
        const where = req.user?.role === 'ADMIN'
            ? (userId ? { userId } : {})
            : { userId: req.user?.sub || userId || '' };

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ items: notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const createNotification = async (req, res) => {
    try {
        const { message, type, userId } = req.body;

        if (!message || !type) {
            return res.status(400).json({
                message: 'Message and type are required'
            });
        }

        const notification = await prisma.notification.create({
            data: {
                userId: req.user?.sub || userId || null,
                message,
                type: normalizeType(type)
            }
        });

        res.status(201).json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const createInternalNotification = async (req, res) => {
    try {
        const { message, type, userId } = req.body;

        if (!message || !type || !userId) {
            return res.status(400).json({
                message: 'Message, type, and userId are required'
            });
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                message,
                type: normalizeType(type)
            }
        });

        res.status(201).json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getNotificationsByUser = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.params.userId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ items: notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getNotificationById = async (req, res) => {
    try {
        const notification = await prisma.notification.findUnique({
            where: { id: Number(req.params.id) }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (req.user?.role !== 'ADMIN' && notification.userId !== req.user?.sub) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const notification = await prisma.notification.update({
            where: { id: Number(req.params.id) },
            data: { isRead: true }
        });

        res.status(200).json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateNotification = async (req, res) => {
    try {
        const notification = await prisma.notification.findUnique({
            where: { id: Number(req.params.id) }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        const { message, type } = req.body;
        const data = {};

        if (message) data.message = message;
        if (type) data.type = normalizeType(type);

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ message: 'No update fields provided' });
        }

        const updatedNotification = await prisma.notification.update({
            where: { id: Number(req.params.id) },
            data
        });

        res.status(200).json(updatedNotification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteNotification = async (req, res) => {
    try {
        await prisma.notification.delete({
            where: { id: Number(req.params.id) }
        });

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    listNotifications,
    createNotification,
    createInternalNotification,
    getNotificationsByUser,
    getNotificationById,
    markNotificationRead,
    updateNotification,
    deleteNotification
};
