const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

describe('User API', () => {

    test('GET /api/v1/users/me should reject requests without authentication', async () => {

        const response = await request(app)
            .get('/api/v1/users/me');

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Authentication required');
    });

    test('GET /api/v1/users/me should reject an invalid token', async () => {

        const response = await request(app)
            .get('/api/v1/users/me')
            .set('Authorization', 'Bearer invalid-token');

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Invalid or expired token');
    });

});