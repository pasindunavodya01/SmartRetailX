const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';

jest.mock('../src/config/prisma', () => ({
    notification: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn()
    }
}));
const prisma = require('../src/config/prisma');

const userToken = jwt.sign({ sub: 'user-1', role: 'USER' }, process.env.JWT_SECRET);

describe('Notification API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('GET /api/v1/notifications/users/:userId should return notifications', async () => {
        prisma.notification.findMany.mockResolvedValue([
            { id: '1', userId: 'user-1', message: 'Test message', read: false }
        ]);

        const response = await request(app)
            .get('/api/v1/notifications/users/user-1')
            .set('Authorization', `Bearer ${userToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].message).toBe('Test message');
    });

    test('POST /api/v1/internal/notifications should create internal notification without token', async () => {
        prisma.notification.create.mockResolvedValue({
            id: '2', userId: 'user-2', message: 'Internal', type: 'INFO'
        });

        const response = await request(app)
            .post('/api/v1/internal/notifications')
            .send({
                userId: 'user-2',
                message: 'Internal',
                type: 'INFO'
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Internal');
    });
});
