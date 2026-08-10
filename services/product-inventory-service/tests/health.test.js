const request = require('supertest');

const app = require('../src/app');

describe('Health endpoint', () => {

    test('GET /api/v1/health should return healthy', async () => {

        const response = await request(app)
            .get('/api/v1/health');

        expect(response.statusCode).toBe(200);

        expect(response.body).toEqual({
            status: 'healthy',
            service: 'product-inventory-service'
        });
    });

});
