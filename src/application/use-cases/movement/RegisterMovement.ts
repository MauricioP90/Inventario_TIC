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

        // Validación de seguridad: no se pueden realizar traslados sobre equipos dados de baja (Inactivos)
        for (const activoId of dto.activoIds) {
            const activo = await this.activoRepository.findById(activoId);
            if (activo && activo.estado === 'BAJA') {
                throw new Error(`El equipo con placa "${activo.placa}" se encuentra dado de BAJA (Inactivo). No está permitido realizar movimientos sobre él.`);
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
        const isLocalSIM = ['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(dto.type);
        const destinationLocationId = isLocalSIM ? dto.originLocationId : dto.destinationLocationId;

        // 1. Crear la instancia de dominio (esto ya valida los campos básicos)
        const movement = new Movement({
            ...dto,
            destinationLocationId,
            status: MovementStatus.PENDING
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