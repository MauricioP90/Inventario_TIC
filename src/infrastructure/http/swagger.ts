import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

import { swaggerSchemas } from './swagger-schemas';

export const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Inventory System API',
            version: '1.0.0',
            description: 'API para la gestión de inventario de activos y tarjetas SIM',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor Local',
            },
        ],
        components: {
            securitySchemes: {
                keycloak: {
                    type: 'oauth2',
                    flows: {
                        implicit: {
                            authorizationUrl: 'http://keycloak-server/auth/realms/your-realm/protocol/openid-connect/auth',
                            scopes: {
                                profile: 'Access to profile information',
                                email: 'Access to email address',
                            },
                        },
                    },
                },
            },
            schemas: swaggerSchemas
        },
    },
    apis: [
        './src/infrastructure/http/controllers/*.ts',
        './src/infrastructure/http/routes/*.ts',
        './src/infrastructure/http/swagger-schemas.ts'
    ], // Rutas donde buscar anotaciones
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log('📖 Swagger documentation available at http://localhost:3000/api-docs');
};
