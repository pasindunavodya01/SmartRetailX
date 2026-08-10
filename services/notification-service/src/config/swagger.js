const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.3',

        info: {
            title: 'SmartRetailX Notification Service API',
            version: '1.0.0',
            description:
                'Notification management API for the SmartRetailX platform'
        },

        servers: [
            {
                url: 'http://localhost:3002',
                description: 'Local development server'
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
