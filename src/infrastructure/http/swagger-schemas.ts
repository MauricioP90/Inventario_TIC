export const swaggerSchemas = {
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
            responsibleId: { type: 'string', format: 'uuid' }
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
            estado: { type: 'string', enum: ['ACTIVO', 'INACTIVO'] }
        }
    },
    Responsible: {
        type: 'object',
        required: ['nombre', 'cargo', 'departamento', 'email', 'estado'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string' },
            cargo: { type: 'string' },
            departamento: { type: 'string' },
            email: { type: 'string' },
            estado: { type: 'string', enum: ['ACTIVO', 'INACTIVO'] }
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
    }
};
