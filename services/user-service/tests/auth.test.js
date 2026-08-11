const request = require('supertest');
const app = require('../src/app');
const bcrypt = require('bcrypt');

process.env.JWT_SECRET = 'test-secret';

jest.mock('../src/config/prisma', () => ({
    user: {
        findUnique: jest.fn(),
        create: jest.fn()
    }
}));
const prisma = require('../src/config/prisma');

const testEmail = `test-${Date.now()}@smartretailx.com`;
const testPassword = 'Password123!';

describe('Authentication API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('POST /api/v1/auth/register should create a user', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue({
            id: 1,
            email: testEmail,
            firstName: 'Test',
            lastName: 'User',
            role: 'USER'
        });

        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: testEmail,
                password: testPassword,
                firstName: 'Test',
                lastName: 'User'
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('User registered successfully');
        expect(response.body.user.email).toBe(testEmail);
        expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    test('POST /api/v1/auth/login should return a JWT', async () => {
        const passwordHash = await bcrypt.hash(testPassword, 10);
        prisma.user.findUnique.mockResolvedValue({
            id: 1,
            email: testEmail,
            passwordHash,
            isActive: true,
            role: 'USER'
        });

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testEmail,
                password: testPassword
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Login successful');
        expect(response.body.token).toBeDefined();
    });

    test('POST /api/v1/auth/login should reject an invalid password', async () => {
        const passwordHash = await bcrypt.hash(testPassword, 10);
        prisma.user.findUnique.mockResolvedValue({
            id: 1,
            email: testEmail,
            passwordHash,
            isActive: true,
            role: 'USER'
        });

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testEmail,
                password: 'WrongPassword123!'
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Invalid credentials');
    });

});