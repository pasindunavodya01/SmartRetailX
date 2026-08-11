const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';

jest.mock('../src/config/prisma', () => ({
    product: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn()
    },
    inventoryItem: {
        findMany: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn()
    }
}));
const prisma = require('../src/config/prisma');

const adminToken = jwt.sign({ sub: 'user-1', role: 'ADMIN' }, process.env.JWT_SECRET);
const userToken = jwt.sign({ sub: 'user-2', role: 'USER' }, process.env.JWT_SECRET);

describe('Product Inventory API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('GET /api/v1/products should return list of products', async () => {
        prisma.product.findMany.mockResolvedValue([
            { id: '1', sku: 'P1', name: 'Product 1', price: 10 }
        ]);

        const response = await request(app)
            .get('/api/v1/products')
            .set('Authorization', `Bearer ${userToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].name).toBe('Product 1');
    });

    test('POST /api/v1/products should allow ADMIN to create product', async () => {
        prisma.product.create.mockResolvedValue({
            id: '2', sku: 'P2', name: 'Product 2', price: 20
        });

        const response = await request(app)
            .post('/api/v1/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ sku: 'P2', name: 'Product 2', price: 20 });

        expect(response.statusCode).toBe(201);
        expect(response.body.name).toBe('Product 2');
    });

    test('POST /api/v1/products should reject USER', async () => {
        const response = await request(app)
            .post('/api/v1/products')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ sku: 'P2', name: 'Product 2', price: 20 });

        expect(response.statusCode).toBe(403);
    });
});
