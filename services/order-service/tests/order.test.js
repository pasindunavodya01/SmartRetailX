const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';

jest.mock('../src/config/prisma', () => ({
    order: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn()
    },
    orderItem: {
        deleteMany: jest.fn(),
        findMany: jest.fn()
    }
}));
const prisma = require('../src/config/prisma');

global.fetch = jest.fn();

const userToken = jwt.sign({ sub: 'user-1', role: 'USER' }, process.env.JWT_SECRET);
const adminToken = jwt.sign({ sub: 'admin-1', role: 'ADMIN' }, process.env.JWT_SECRET);

describe('Order API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ productId: 'prod-1', sku: 'SKU-1', stock: 10 })
        });
    });

    test('GET /api/v1/orders should return orders for USER', async () => {
        prisma.order.findMany.mockResolvedValue([
            { id: '1', customerId: 'user-1', status: 'PENDING' }
        ]);

        const response = await request(app)
            .get('/api/v1/orders')
            .set('Authorization', `Bearer ${userToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.items).toHaveLength(1);
        expect(prisma.order.findMany).toHaveBeenCalledWith({
            where: { customerId: 'user-1' },
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
    });

    test('POST /api/v1/orders should create an order', async () => {
        prisma.order.create.mockResolvedValue({
            id: '2', customerId: 'user-1', status: 'PENDING'
        });

        const response = await request(app)
            .post('/api/v1/orders')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                customerId: 'user-1',
                items: [
                    { sku: 'SKU-1', quantity: 2, price: 10 }
                ]
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.id).toBe('2');
        expect(global.fetch).toHaveBeenCalled(); // Should call inventory/consume
    });
});
