export const swaggerSchemas = {
    Role: {
        type: 'object',
        required: ['nombre', 'estado'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string' },
            estado: { type: 'string', enum: ['ACTIVO', 'INACTIVO'] }
        }
    },
    Activo: {
        type: 'object',
        required: ['placa', 'tipo', 'marca', 'modelo', 'serial', 'estado', 'fechaIngreso', 'locationId', 'responsibleId'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            placa: { type: 'string' },
            tipo: { type: 'string' },
            marca: { type: 'string' },
            modelo: { type: 'string' },
            serial: { type: 'string' },
            estado: { type: 'string', enum: ['BODEGA', 'OPERACION', 'MANTENIMIENTO', 'BAJA'] },
            facturaUrl: { type: 'string' },
            fechaIngreso: { type: 'string', format: 'date-time' },
            locationId: { type: 'string', format: 'uuid' },
            responsibleId: { type: 'string', format: 'uuid' },
            location: { $ref: '#/components/schemas/Location' },
            responsable: { $ref: '#/components/schemas/Responsible' }
        }
    },
    Location: {
        type: 'object',
        required: ['code', 'nombre', 'estado'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string' },
            nombre: { type: 'string' },
            responsableId: { type: 'string', format: 'uuid', nullable: true },
            coordenadas: { type: 'string', nullable: true },
            estado: { type: 'string', enum: ['ACTIVO', 'INACTIVO'] },
            responsibleIds: {
                type: 'array',
                items: { type: 'string', format: 'uuid' }
            }
        }
    },
    Responsible: {
        type: 'object',
        required: ['nombre', 'email', 'telefono', 'estado'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string' },
            email: { type: 'string' },
            telefono: { type: 'string' },
            estado: { type: 'string', enum: ['ACTIVO', 'INACTIVO'] },
            role: { $ref: '#/components/schemas/Role' },
            locationIds: {
                type: 'array',
                items: { type: 'string', format: 'uuid' }
            },
            totalActivos: { type: 'number' },
            totalSIMCards: { type: 'number' }
        }
    },
    SIMCard: {
        type: 'object',
        required: ['ICCID', 'numero', 'operador', 'estado'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            ICCID: { type: 'string' },
            numero: { type: 'string' },
            operador: { type: 'string' },
            estado: { type: 'string', enum: ['BODEGA', 'ASIGNADA', 'MANTENIMIENTO', 'BAJA'] },
            activoId: { type: 'string', format: 'uuid' }
        }
    },
    Movement: {
        type: 'object',
        required: ['type', 'originLocationId', 'destinationLocationId', 'responsibleId', 'status', 'activoIds', 'createdAt'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string', example: 'TRASLADO' },
            originLocationId: { type: 'string', format: 'uuid' },
            destinationLocationId: { type: 'string', format: 'uuid' },
            responsibleId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['PENDING', 'EN_TRANSIT', 'RECEIVED', 'CANCELLED'] },
            activoIds: {
                type: 'array',
                items: { type: 'string', format: 'uuid' }
            },
            notes: { type: 'string', nullable: true },
            evidenceUrl: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            shippedAt: { type: 'string', format: 'date-time', nullable: true },
            receivedAt: { type: 'string', format: 'date-time', nullable: true },
            originLocation: { $ref: '#/components/schemas/Location' },
            destinationLocation: { $ref: '#/components/schemas/Location' },
            responsible: { $ref: '#/components/schemas/Responsible' },
            activos: {
                type: 'array',
                items: { $ref: '#/components/schemas/Activo' }
            }
        }
    }
};
