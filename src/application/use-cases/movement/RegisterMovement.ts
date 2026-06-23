import { Movement, MovementStatus } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { IEmailService } from "../../../domain/services/IEmailService";

export interface RegisterMovementDto {
    type: string;
    originLocationId: string;
    destinationLocationId: string;
    responsibleId: string;
    activoIds: string[];
    simCardIds?: string[];
    notes?: string;
    recipients?: string[];
    destinationAreaId?: string; // Solo para TRASLADO_AREA
}

export class RegisterMovement {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository,
        private readonly locationRepository: ILocationRepository,
        private readonly responsibleRepository: IResponsibleRepository,
        private readonly emailService: IEmailService

    ) { }

    async execute(dto: RegisterMovementDto): Promise<Movement> {

        // Obtener ubicaciones de origen y destino
        const originLocation = await this.locationRepository.findById(dto.originLocationId);
        const destinationLocation = await this.locationRepository.findById(dto.destinationLocationId);

        if (!originLocation || !destinationLocation) {
            throw new Error('Ubicación de origen o destino no encontrada.');
        }

        const isOriginBodega = originLocation.tipo === 'BODEGA';
        const isDestBodega = destinationLocation.tipo === 'BODEGA';
        const isOriginProvider = originLocation.tipo === 'PROVEEDOR';
        const isDestProvider = destinationLocation.tipo === 'PROVEEDOR';

        if (isOriginProvider && isDestProvider) {
            throw new Error('No se permiten traslados directos entre Proveedores.');
        }

        // Validación de seguridad: no se pueden realizar traslados sobre equipos dados de baja (Inactivos)
        for (const activoId of dto.activoIds) {
            const activo = await this.activoRepository.findById(activoId);
            if (activo) {
                if (activo.estado === 'BAJA') {
                    throw new Error(`El equipo con placa "${activo.placa}" se encuentra dado de BAJA (Inactivo). No está permitido realizar movimientos sobre él.`);
                }
                // Validación de mantenimiento: equipos en mantenimiento no pueden moverse a menos que sea a Bodega o Proveedor
                if (activo.estado === 'MANTENIMIENTO') {
                    const isAllowedMaintenanceMovement = 
                        ['RETORNO_SOPORTE', 'REINGRESO_SOPORTE', 'RETORNO_PROVEEDOR'].includes(dto.type.toUpperCase()) ||
                        (dto.type.toUpperCase() === 'ENVIO_PROVEEDOR' && 
                         (isOriginBodega || isOriginProvider) && 
                         (isDestBodega || isDestProvider)) ||
                        (dto.type.toUpperCase() === 'TRASLADO_REGIONAL' && isOriginBodega && isDestBodega);

                    if (!isAllowedMaintenanceMovement) {
                        throw new Error(`El equipo con placa "${activo.placa}" está en MANTENIMIENTO. Solo se permiten traslados entre Bodegas, envíos a Proveedor o retornos.`);
                    }
                }
            }
        }

        // Validación de regla de negocio: baja_activo requiere que el equipo no tenga SIMs asociadas
        if (dto.type && dto.type.toUpperCase() === 'BAJA_ACTIVO') {
            for (const activoId of dto.activoIds) {
                const activo = await this.activoRepository.findById(activoId);
                if (activo && !activo.puedeDarDeBaja()) {
                    throw new Error(`No se puede dar de baja el activo con placa "${activo.placa}" porque tiene una o más SIM Cards asociadas. Por favor, retire las SIM Cards primero.`);
                }
            }
        }

        // Validación de destino para envío a proveedor (mantenimiento)
        if (dto.type && dto.type.toUpperCase() === 'ENVIO_PROVEEDOR') {
            if (originLocation.tipo !== 'BODEGA' || destinationLocation.tipo !== 'PROVEEDOR') {
                throw new Error('El envío a proveedor solo se puede realizar desde una Bodega hacia un Proveedor.');
            }
        }

        // Validación de destino para retorno de proveedor
        if (dto.type && dto.type.toUpperCase() === 'RETORNO_PROVEEDOR') {
            if (originLocation.tipo !== 'PROVEEDOR' || destinationLocation.tipo !== 'BODEGA') {
                throw new Error('El retorno de proveedor solo se puede realizar desde un Proveedor hacia una Bodega.');
            }
        }
        
        const isLocalSIM = ['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL', 'INGRESO_MANTENIMIENTO', 'SALIDA_MANTENIMIENTO'].includes(dto.type);
        const isAreaTransfer = dto.type === 'TRASLADO_AREA';

        // Para traslado entre áreas: validar que la sede origen === destino y que venga el área destino
        if (isAreaTransfer) {
            if (dto.originLocationId !== dto.destinationLocationId) {
                throw new Error('Un traslado entre áreas debe ocurrir dentro de la misma sede.');
            }
            if (!dto.destinationAreaId) {
                throw new Error('El área destino es obligatoria para un traslado entre áreas.');
            }
            // Validar que el área destino pertenece a la sede
            const loc = await this.locationRepository.findById(dto.originLocationId);
            if (loc && loc.areas && loc.areas.length > 0) {
                const validAreaIds = loc.areas.map((a: any) => a.id);
                if (!validAreaIds.includes(dto.destinationAreaId)) {
                    throw new Error('El área destino no pertenece a la sede seleccionada.');
                }
            }
        }

        // Se permiten traslados en la misma sede únicamente para TRASLADO_AREA y SIM locales
        if (!isAreaTransfer && !isLocalSIM && dto.originLocationId === dto.destinationLocationId) {
            throw new Error('La ubicación de origen y destino no pueden ser la misma.');
        }

        const destinationLocationId = isLocalSIM ? dto.originLocationId : dto.destinationLocationId;

        // Generar magic link de inmediato para TRASLADO_AREA (sin paso de despacho)
        const { randomUUID } = isAreaTransfer ? require('node:crypto') : { randomUUID: () => undefined };
        const areaTransferToken = isAreaTransfer ? randomUUID() : undefined;

        // 1. Crear la instancia de dominio (esto ya valida los campos básicos)
        const movement = new Movement({
            ...dto,
            destinationLocationId,
            destinationAreaId: dto.destinationAreaId,
            status: isLocalSIM ? MovementStatus.RECEIVED
                   : isAreaTransfer ? MovementStatus.EN_TRANSIT
                   : MovementStatus.PENDING,
            shippedAt: isLocalSIM ? new Date() : isAreaTransfer ? new Date() : undefined,
            receivedAt: isLocalSIM ? new Date() : undefined,
            magicLinkToken: areaTransferToken
        });
        // 2. Persistir en la base de datos
        const savedMovement = await this.movementRepository.create(movement);
        // 3. Sistema de Envío de Soporte por Correo (Excepto SIMCards)
        const isSimMovement = dto.type && dto.type.startsWith('SIM_');
        if (!isSimMovement && dto.recipients && dto.recipients.length > 0) {
            try {
                // Obtenemos los nombres reales de origen, destino y responsable para el cuerpo del correo
                const originLoc = await this.locationRepository.findById(dto.originLocationId);
                const destLoc = await this.locationRepository.findById(dto.destinationLocationId);
                const resp = await this.responsibleRepository.findById(dto.responsibleId);
                // Mapeamos los activos para obtener marca, modelo y serial
                const assetsDetails = [];
                for (const actId of dto.activoIds) {
                    const act = await this.activoRepository.findById(actId);
                    if (act) {
                        assetsDetails.push({
                            placa: act.placa,
                            marca: act.marca,
                            modelo: act.modelo,
                            serial: act.serial
                        });
                    }
                }
                // Disparamos la notificación al proveedor de correos de forma asíncrona
                await this.emailService.sendMovementNotification(
                    savedMovement,
                    dto.recipients,
                    {
                        activos: assetsDetails,
                        originLocation: originLoc?.nombre ?? 'Sin sede origen',
                        destinationLocation: destLoc?.nombre ?? 'Sin sede destino',
                        responsibleName: resp?.nombre ?? 'Sin responsable'
                    }
                );
            } catch (mailError) {
                // Capturamos el error para no interrumpir el flujo principal si falla el servicio de correo
                console.error("Error al enviar notificación de soporte por correo:", mailError);
            }
        }
        return savedMovement;
    }
}