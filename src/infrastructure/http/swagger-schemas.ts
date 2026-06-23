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
    Area: {
        type: 'object',
        required: ['code', 'nombre', 'estado'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string' },
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
            responsible: { $ref: '#/components/schemas/Responsible' },
            maintenanceModalidad: { type: 'string', enum: ['INTERNO', 'EXTERNO', 'INTERNO_ESCALADO'] },
            maintenanceTipo: { type: 'string', enum: ['PREVENTIVO', 'CORRECTIVO'] },
            maintenanceCostoEstimado: { type: 'number' },
            maintenanceTecnicoResponsable: { type: 'string' }
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
            },
            areas: {
                type: 'array',
                items: { $ref: '#/components/schemas/Area' }
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
            area: { $ref: '#/components/schemas/Area' },
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
            type: { 
                type: 'string', 
                enum: [
                    'TRASLADO_REGIONAL',
                    'ASIGNACION_OFICINA',
                    'SALIDA_PRESTAMO',
                    'RETORNO_SOPORTE',
                    'ENVIO_PROVEEDOR',
                    'RETORNO_PROVEEDOR',
                    'BAJA_ACTIVO',
                    'RETORNO_POR_RECHAZO',
                    'INGRESO_MANTENIMIENTO',
                    'SALIDA_MANTENIMIENTO',
                    'SIM_ASIGNACION',
                    'SIM_CAMBIO',
                    'SIM_RETIRO',
                    'SIM_RETIRO_TOTAL',
                    'SIM_TRASLADO'
                ],
                example: 'TRASLADO_REGIONAL' 
            },
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
    },
    MaintenanceReport: {
        type: 'object',
        required: ['activoId', 'modalidad', 'tipoMantenimiento', 'estado'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            activoId: { type: 'string', format: 'uuid' },
            modalidad: { type: 'string', enum: ['INTERNO', 'EXTERNO', 'INTERNO_ESCALADO'] },
            tipoMantenimiento: { type: 'string', enum: ['PREVENTIVO', 'CORRECTIVO'] },
            estado: { type: 'string', enum: ['PENDIENTE_DIAGNOSTICO', 'EN_PROCESO', 'REQUIERE_AUTORIZACION', 'ENVIADO_PROVEEDOR', 'CERRADO'] },
            diagnostico: { type: 'string', nullable: true },
            accionesRealizadas: { type: 'string', nullable: true },
            repuestosUsados: { type: 'string', nullable: true },
            costoEstimado: { type: 'number', nullable: true },
            costoFinal: { type: 'number', nullable: true },
            cubiertoPorGarantia: { type: 'boolean' },
            tecnicoResponsable: { type: 'string', nullable: true },
            escalaAProveedor: { type: 'boolean' },
            motivoEscalacion: { type: 'string', nullable: true },
            fechaEscalacion: { type: 'string', format: 'date-time', nullable: true },
            proveedorServicio: { type: 'string', nullable: true },
            referenciaOrdenServicio: { type: 'string', nullable: true },
            soporteProveedorUrl: { type: 'string', nullable: true },
            soporteAutorizacionUrl: { type: 'string', nullable: true },
            resultadoFinal: { type: 'string', enum: ['REPARADO', 'IRREPARABLE', 'SIN_FALLAS'], nullable: true },
            fechaApertura: { type: 'string', format: 'date-time' },
            fechaInicioInterno: { type: 'string', format: 'date-time', nullable: true },
            fechaDiagnostico: { type: 'string', format: 'date-time', nullable: true },
            fechaEnvioProveedor: { type: 'string', format: 'date-time', nullable: true },
            fechaRetornoProveedor: { type: 'string', format: 'date-time', nullable: true },
            fechaCierre: { type: 'string', format: 'date-time', nullable: true },
            movimientoOrigenId: { type: 'string', format: 'uuid', nullable: true }
        }
    }
};
