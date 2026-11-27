import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import { swaggerSchemas } from './swagger-schemas';
import { requirePermission } from './middleware/RoleMiddleware';

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
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: swaggerSchemas
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [
        './src/index.ts',
        './src/infrastructure/http/controllers/*.ts',
        './src/infrastructure/http/routes/*.ts',
        './src/infrastructure/http/swagger-schemas.ts'
    ], // Rutas donde buscar anotaciones
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application) => {
    // Documentación protegida exclusivamente para usuarios con permiso swagger:access (Super Admin por defecto)
    app.use('/api-docs', requirePermission('swagger:access'), swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/api-docs.json', requirePermission('swagger:access'), (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
    console.log('📖 Swagger documentation available (permission: swagger:access) at http://localhost:3000/api-docs');
};
