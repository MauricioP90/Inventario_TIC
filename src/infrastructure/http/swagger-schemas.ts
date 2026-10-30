export const swaggerSchemas = {
    Cargo: {
        type: 'object',
        required: ['nombre', 'estado'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string', example: 'Coordinador' },
            estado: { type: 'string', enum: ['ACTIVO', 'INACTIVO'], example: 'ACTIVO' }
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
    TipoActivo: {
        type: 'object',
        required: ['nombre', 'estado'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string', example: 'Terminal POS' },
            estado: { type: 'string', enum: ['ACTIVO', 'INACTIVO'], example: 'ACTIVO' },
            admiteSoftware: { type: 'boolean', example: true }
        }
    },
    ModeloActivo: {
        type: 'object',
        required: ['tipoActivoId', 'marca', 'modelo', 'estado'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            tipoActivoId: { type: 'string', format: 'uuid' },
            marca: { type: 'string', example: 'Sunmi' },
            modelo: { type: 'string', example: 'V2 Pro' },
            estado: { type: 'string', enum: ['ACTIVO', 'INACTIVO'], example: 'ACTIVO' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
        }
    },
    SoftwareApp: {
        type: 'object',
        required: ['nombre', 'estado'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            nombre: { type: 'string', example: 'Xone POS' },
            descripcion: { type: 'string', nullable: true, example: 'Aplicativo de venta de tiquetes en terminales móviles' },
            estado: { type: 'string', enum: ['ACTIVO', 'INACTIVO'], example: 'ACTIVO' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
        }
    },
    SoftwareVersion: {
        type: 'object',
        required: ['softwareAppId', 'version', 'esVigente'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            softwareAppId: { type: 'string', format: 'uuid' },
            version: { type: 'string', example: '1.02' },
            esVigente: { type: 'boolean', example: true },
            notasLanzamiento: { type: 'string', nullable: true, example: 'Parche de estabilidad de impresión térmica' },
            fechaLanzamiento: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' }
        }
    },
    ActivoSoftwareHistory: {
        type: 'object',
        required: ['activoId', 'softwareVersionId', 'estado', 'fechaInstalacion'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            activoId: { type: 'string', format: 'uuid' },
            softwareVersionId: { type: 'string', format: 'uuid' },
            licencia: { type: 'string', nullable: true, example: 'LIC-XONE-2026-001' },
            estado: { type: 'string', enum: ['INSTALADO', 'ACTUALIZADO', 'RETIRADO'], example: 'INSTALADO' },
            instaladoPor: { type: 'string', example: 'admin' },
            fechaInstalacion: { type: 'string', format: 'date-time' },
            fechaRetiro: { type: 'string', format: 'date-time', nullable: true },
            retiradoPor: { type: 'string', nullable: true },
            motivoRetiro: { type: 'string', nullable: true },
            observaciones: { type: 'string', nullable: true }
        }
    },
    InstalledSoftwareEvaluation: {
        type: 'object',
        properties: {
            historyId: { type: 'string', format: 'uuid' },
            activoId: { type: 'string', format: 'uuid' },
            appId: { type: 'string', format: 'uuid' },
            appNombre: { type: 'string', example: 'Xone POS' },
            versionInstaladaId: { type: 'string', format: 'uuid' },
            versionInstalada: { type: 'string', example: '0.01' },
            versionVigenteOficial: { type: 'string', nullable: true, example: '1.02' },
            semaforoVigencia: { type: 'string', enum: ['AL_DIA', 'DESACTUALIZADO', 'SUPERIOR_BETA', 'SIN_OFICIAL'], example: 'DESACTUALIZADO' },
            licencia: { type: 'string', nullable: true },
            fechaInstalacion: { type: 'string', format: 'date-time' },
            instaladoPor: { type: 'string' },
            observaciones: { type: 'string', nullable: true }
        }
    },
    ActivoDocumentHistory: {
        type: 'object',
        required: ['activoId'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            activoId: { type: 'string', format: 'uuid' },
            previousFacturaUrl: { type: 'string', nullable: true },
            newFacturaUrl: { type: 'string', nullable: true },
            previousPrecioCompra: { type: 'number', nullable: true },
            newPrecioCompra: { type: 'number', nullable: true },
            changedByUser: { type: 'string', nullable: true },
            justification: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' }
        }
    },
    Activo: {
        type: 'object',
        required: ['placa', 'tipoActivoId', 'marca', 'modelo', 'serial', 'estado', 'fechaIngreso', 'locationId'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            placa: { type: 'string' },
            tipoActivoId: { type: 'string', format: 'uuid' },
            tipoActivo: { $ref: '#/components/schemas/TipoActivo', nullable: true },
            marca: { type: 'string' },
            modelo: { type: 'string' },
            serial: { type: 'string' },
            precioCompra: { type: 'number', nullable: true },
            estado: { type: 'string', enum: ['DISPONIBLE', 'OPERACION', 'MANTENIMIENTO', 'BAJA', 'EN_TRANSITO', 'RECHAZADO'] },
            facturaUrl: { type: 'string', nullable: true },
            fechaIngreso: { type: 'string', format: 'date-time' },
            locationId: { type: 'string', format: 'uuid' },
            areaId: { type: 'string', format: 'uuid', nullable: true },
            responsibleId: { type: 'string', format: 'uuid', nullable: true },
            location: { $ref: '#/components/schemas/Location' },
            area: { $ref: '#/components/schemas/Area', nullable: true },
            responsible: { $ref: '#/components/schemas/Responsible', nullable: true },
            simCards: {
                type: 'array',
                items: { $ref: '#/components/schemas/SIMCard' }
            },
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
            tipo: { type: 'string', enum: ['PUNTO_TI', 'OFICINA_PROPIA', 'CONTRATISTA', 'PROVEEDOR', 'OFICINA', 'BODEGA', 'REGIONAL'], example: 'OFICINA_PROPIA' },
            ciudad: { type: 'string', nullable: true, example: 'Bogotá' },
            responsableId: { type: 'string', format: 'uuid', nullable: true },
            coordenadas: { type: 'string', nullable: true, example: '4.60971,-74.08175' },
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
            tipoDocumento: { type: 'string', enum: ['CC', 'CE', 'NIT', 'PASAPORTE'], default: 'CC' },
            numeroDocumento: { type: 'string', nullable: true },
            fechaExpedicionDocumento: { type: 'string', format: 'date', nullable: true },
            direccion: { type: 'string', nullable: true },
            estado: { type: 'string', enum: ['ACTIVO', 'INACTIVO'] },
            area: { $ref: '#/components/schemas/Area', nullable: true },
            cargo: { $ref: '#/components/schemas/Cargo', nullable: true },
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
            activoId: { type: 'string', format: 'uuid', nullable: true },
            locationId: { type: 'string', format: 'uuid', nullable: true }
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
                    'SIM_TRASLADO',
                    'TRASLADO_AREA',
                    'HURTO_PERDIDA',
                    'ENTREGA_COMISION',
                    'PRESTAMO_PARTICIPE',
                    'REINTEGRO_PARCIAL'
                ],
                example: 'TRASLADO_REGIONAL' 
            },
            originLocationId: { type: 'string', format: 'uuid' },
            destinationLocationId: { type: 'string', format: 'uuid' },
            destinationAreaId: { type: 'string', format: 'uuid', nullable: true },
            responsibleId: { type: 'string', format: 'uuid' },
            receiverId: { type: 'string', format: 'uuid', nullable: true },
            status: { type: 'string', enum: ['PENDING', 'EN_TRANSIT', 'RECEIVED', 'CANCELLED'] },
            activoIds: {
                type: 'array',
                items: { type: 'string', format: 'uuid' }
            },
            simCardIds: {
                type: 'array',
                items: { type: 'string', format: 'uuid' }
            },
            notes: { type: 'string', nullable: true },
            documentUrl: { type: 'string', nullable: true },
            evidenceUrl: { type: 'string', nullable: true },
            receivedEvidenceUrl: { type: 'string', nullable: true },
            magicLinkToken: { type: 'string', nullable: true },
            rejectionReason: { type: 'string', nullable: true },
            rejectedAt: { type: 'string', format: 'date-time', nullable: true },
            cancellationReason: { type: 'string', nullable: true },
            cancelledBy: { type: 'string', nullable: true },
            cancelledAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            shippedAt: { type: 'string', format: 'date-time', nullable: true },
            receivedAt: { type: 'string', format: 'date-time', nullable: true },
            originLocation: { $ref: '#/components/schemas/Location' },
            destinationLocation: { $ref: '#/components/schemas/Location' },
            responsible: { $ref: '#/components/schemas/Responsible' },
            receiver: { $ref: '#/components/schemas/Responsible', nullable: true },
            activos: {
                type: 'array',
                items: { $ref: '#/components/schemas/Activo' }
            },
            simCards: {
                type: 'array',
                items: { $ref: '#/components/schemas/SIMCard' }
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
    },
    NotificationRecipient: {
        type: 'object',
        required: ['email', 'nombre', 'tipoCopia', 'eventos'],
        properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email', example: 'usuario@flotalamacarena.com' },
            nombre: { type: 'string', example: 'Juan Pérez' },
            area: { type: 'string', nullable: true, example: 'Contabilidad' },
            tipoCopia: { type: 'string', enum: ['CC', 'BCC'], example: 'CC' },
            isActive: { type: 'boolean', example: true },
            eventos: {
                type: 'array',
                items: { type: 'string' },
                example: ['DESPACHO_TRASLADO', 'RECEPCION_TRASLADO', 'MOVIMIENTO_NO_AUTORIZADO']
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
        }
    },
    ActivoTelemetryLog: {
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            activoId: { type: 'string', format: 'uuid' },
            placa: { type: 'string', example: 'POS-001' },
            reportedCoords: { type: 'string', example: '4.142,-73.6266' },
            reportedIp: { type: 'string', nullable: true, example: '10.10.25.44' },
            expectedLocationId: { type: 'string', format: 'uuid', nullable: true },
            expectedLocationName: { type: 'string', nullable: true, example: 'Terminal Salitre Bogotá' },
            detectedLocationId: { type: 'string', format: 'uuid', nullable: true },
            detectedLocationName: { type: 'string', nullable: true, example: 'Agencia Villavicencio (Villavicencio)' },
            distanceKm: { type: 'number', nullable: true, example: 74.82 },
            status: {
                type: 'string',
                enum: ['CONFORME', 'EN_TRANSITO_AUTORIZADO', 'CONTROVERSIA_UBICACION', 'SIN_COORDENADAS_SEDE']
            },
            alertSent: { type: 'boolean', example: true },
            notificationUuid: { type: 'string', nullable: true },
            observaciones: { type: 'string', nullable: true },
            reportedAt: { type: 'string', format: 'date-time' }
        }
    }
};
