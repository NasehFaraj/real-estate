import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const accessCookieName = process.env.ACCESS_COOKIE_NAME ?? 'access_token';

export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Real Estate API',
            version: '1.0.0',
            description: 'API for offers, requests, matches, users, stats, auth',
        },
        tags: [
            { name: 'Auth' },
            { name: 'Users' },
            { name: 'Offers' },
            { name: 'Requests' },
            { name: 'Matches' },
            { name: 'Stats' },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: accessCookieName,
                },
            },
            schemas: {
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        data: { type: 'object', nullable: true },
                        error: { type: 'object', nullable: true },
                    },
                },
                PaginationResponse: {
                    type: 'object',
                    properties: {
                        items: { type: 'array', items: {} },
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string' },
                        createdAt: { type: 'string' },
                        updatedAt: { type: 'string' },
                    },
                },
                Offer: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        propertyType: { type: 'string' },
                        category: { type: 'string' },
                        status: { type: 'string' },
                        city: { type: 'string' },
                        district: { type: 'string' },
                        coordinates: { type: 'string' },
                        areaFrom: { type: 'number' },
                        areaTo: { type: 'number' },
                        pricePerMeter: { type: 'number' },
                        priceTotal: { type: 'number' },
                        offerStatus: { type: 'boolean' },
                        brokerName: { type: 'string' },
                        brokerId: { type: 'string' },
                        createdAt: { type: 'string' },
                        updatedAt: { type: 'string' },
                    },
                },
                Request: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        propertyType: { type: 'string' },
                        usage: { type: 'string' },
                        status: { type: 'string' },
                        priority: { type: 'string' },
                        city: { type: 'string' },
                        district: { type: 'string' },
                        minArea: { type: 'number' },
                        maxArea: { type: 'number' },
                        budget: { type: 'number' },
                        brokerName: { type: 'string' },
                        brokerId: { type: 'string' },
                        createdAt: { type: 'string' },
                        updatedAt: { type: 'string' },
                    },
                },
                Match: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        offerId: { type: 'string' },
                        requestId: { type: 'string' },
                        brokerId: { type: 'string' },
                        status: { type: 'string' },
                        score: { type: 'number' },
                        createdAt: { type: 'string' },
                        updatedAt: { type: 'string' },
                    },
                },
            },
        },
        security: [{ cookieAuth: [] }],
    },
    apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'],
});

export const swaggerUiMiddleware = swaggerUi.serve;
export const swaggerUiHandler = swaggerUi.setup(swaggerSpec);
