const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.3',

        info: {
            title: 'SmartRetailX User Service API',
            version: '1.0.0',
            description:
                'User management and authentication API for the SmartRetailX platform'
        },

        servers: [
            {
                url: '/',
                description: 'API Server'
            }
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },

    apis: [
        './src/routes/*.js'
    ]
};

module.exports = swaggerJsdoc(options);