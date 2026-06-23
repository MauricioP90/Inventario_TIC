import { Movement } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";
import { IMaintenanceReportRepository } from "../../../domain/repositories/IMaintenanceReportRepository";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { MaintenanceReport, ModalidadMantenimiento, TipoMantenimiento, EstadoFicha } from "../../../domain/entities/MaintenanceReport";

export class ReceiveByMagicLink {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository,
        private readonly simCardRepository: ISIMCardRepository,
        private readonly maintenanceReportRepository: IMaintenanceReportRepository,
        private readonly responsibleRepository: IResponsibleRepository,
        private readonly locationRepository: ILocationRepository
    ) { }

    async execute(token: string, physicalReceiverName: string): Promise<Movement> {
        // 1. Buscar el movimiento por el token mágico
        const movement = await this.movementRepository.findByMagicLinkToken(token);

        if (!movement) {
            throw new Error('Enlace de autenticación única inválido o expirado.');
        }

        if (movement.status !== 'EN_TRANSIT') {
            throw new Error('Este movimiento no está en tránsito.');
        }

        if (!physicalReceiverName || physicalReceiverName.trim() === '') {
            throw new Error('El nombre de quien recibe es obligatorio.');
        }

        // 2. Cambiar estado y guardar datos de recepción directamente en los props internos.
        // NO se pasa receiverId porque quien recibe no tiene cuenta en el sistema.
        // physicalReceiverName es el único dato de identidad del receptor externo.
        (movement as any).props.status = 'RECEIVED';
        (movement as any).props.receivedAt = new Date();
        (movement as any).props.physicalReceiverName = physicalReceiverName.trim();
        (movement as any).props.magicLinkToken = null; // Consumir el token (un solo uso)
        (movement as any).props.receivedEvidenceUrl = null;

        // Cargar el custodio destino
        const destinationResponsible = await this.responsibleRepository.findById(movement.responsibleId);
        if (!destinationResponsible) {
            throw new Error('El responsable de destino no existe en el sistema.');
        }

        // Determinar el área destino:
        // Para TRASLADO_AREA usamos el área explícita almacenada en el movimiento.
        // Para otros tipos lo derivamos del responsable o de la primera área de la sede.
        let newAreaId = '8b8b9c8c-1e2a-43cf-8a27-024848bb0000'; // NO APLICA por defecto
        if (movement.type === 'TRASLADO_AREA' && movement.destinationAreaId) {
            newAreaId = movement.destinationAreaId;
        } else {
            const location = await this.locationRepository.findById(movement.destinationLocationId);
            if (location && location.areas && location.areas.length > 0) {
                if (destinationResponsible.area) {
                    newAreaId = destinationResponsible.area.id!;
                } else {
                    newAreaId = location.areas[0].id!;
                }
            }
        }

        // 3. Actualizar la ubicación de todos los activos involucrados
        for (const activoId of movement.activoIds) {
            const activo = await this.activoRepository.findById(activoId);
            if (activo) {
                // Actualizar estado operativo del activo
                activo.aplicarRecepcionDeMovimiento(movement.type, movement.destinationLocationId);
                // Actualizar custodia (responsable) y área
                activo.asignarResponsable(destinationResponsible);
                activo.changeArea(newAreaId);

                await this.activoRepository.update(activo);

                // Si el movimiento recibido es de tipo RETORNO_POR_RECHAZO, creamos automáticamente una Ficha de Mantenimiento
                if (movement.type === 'RETORNO_POR_RECHAZO') {
                    const report = new MaintenanceReport({
                        activoId: activo.id!,
                        modalidad: ModalidadMantenimiento.INTERNO,
                        tipoMantenimiento: TipoMantenimiento.CORRECTIVO,
                        estado: EstadoFicha.PENDIENTE_DIAGNOSTICO,
                        movimientoOrigenId: movement.id!,
                        diagnostico: 'Creado automáticamente por reporte de NOVEDAD/RECHAZO en el traslado. Requiere realizar diagnóstico técnico completo para definir acciones.'
                    });
                    await this.maintenanceReportRepository.save(report);
                }
            }
        }

        // 4. Actualizar la ubicación de todas las SIM Cards involucradas
        if (movement.simCardIds && movement.simCardIds.length > 0) {
            const sims = await this.simCardRepository.findAll();
            const simsInMovement = sims.filter(s => movement.simCardIds.includes(s.id!));
            for (const sim of simsInMovement) {
                sim.update({ locationId: movement.destinationLocationId });
                await this.simCardRepository.save(sim);
            }
        }

        // 5. Persistir cambios del movimiento
        return await this.movementRepository.update(movement);
    }
}
