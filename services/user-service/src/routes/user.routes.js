const express = require('express');

const authenticate = require('../middleware/auth.middleware');

const {
    getCurrentUser
} = require('../controllers/user.controller');

const router = express.Router();

router.get('/me', authenticate, getCurrentUser);

module.exports = router;