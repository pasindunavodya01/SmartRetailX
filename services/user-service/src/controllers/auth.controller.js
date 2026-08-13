const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = require('../config/prisma');

const register = async (req, res) => {
    try {
        const {
            email,
            password,
            firstName,
            lastName
        } = req.body;

        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'User already exists'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const role = email.startsWith('admin') ? 'ADMIN' : 'CUSTOMER';

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                role
            }
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        const passwordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordValid) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            {
                sub: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        res.status(200).json({
            message: 'Login successful',
            token
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

module.exports = {
    register,
    login
};