const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';

const adminToken = jwt.sign({ id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' }, process.env.JWT_SECRET);
const userToken = jwt.sign({ id: 'user-1', email: 'user@example.com', role: 'USER' }, process.env.JWT_SECRET);

describe('Admin API', () => {

    test('GET /api/v1/admin/dashboard should be accessible to ADMIN', async () => {
        const response = await request(app)
            .get('/api/v1/admin/dashboard')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Welcome to the admin dashboard');
        expect(response.body.user.role).toBe('ADMIN');
    });

    test('GET /api/v1/admin/dashboard should reject USER', async () => {
        const response = await request(app)
            .get('/api/v1/admin/dashboard')
            .set('Authorization', `Bearer ${userToken}`);

        expect(response.statusCode).toBe(403);
    });

    test('GET /api/v1/admin/dashboard should reject requests without authentication', async () => {
        const response = await request(app)
            .get('/api/v1/admin/dashboard');

        expect(response.statusCode).toBe(401);
    });

});
