import { Movement, MovementStatus } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";
import { IMaintenanceReportRepository } from "../../../domain/repositories/IMaintenanceReportRepository";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { MaintenanceReport, ModalidadMantenimiento, TipoMantenimiento, EstadoFicha } from "../../../domain/entities/MaintenanceReport";
import { IEmailService } from "../../../domain/services/IEmailService";

export class ReceiveMovement {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository,
        private readonly simCardRepository: ISIMCardRepository,
        private readonly maintenanceReportRepository: IMaintenanceReportRepository,
        private readonly responsibleRepository: IResponsibleRepository,
        private readonly locationRepository: ILocationRepository,
        private readonly emailService?: IEmailService
    ) { }

    async execute(id: string, receiverId: string, receiverEvidenceUrl: string, destinationLocationId?: string): Promise<Movement> {
        // 1. Buscar el movimiento
        const movement = await this.movementRepository.findById(id);
        if (!movement) {
            throw new Error('Movimiento no encontrado');
        }
        // 2. Si se suministra una sede destino diferente al recibir, la actualizamos en el movimiento
        if (destinationLocationId && destinationLocationId !== movement.destinationLocationId) {
            movement.changeDestinationLocation(destinationLocationId);
        }
        // 3. Aplicar lógica de dominio para recibir
        movement.receive(receiverId, receiverEvidenceUrl);

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

        // 4. Actualizar la ubicación de todos los activos involucrados
        const assets = await this.activoRepository.findAll(); // En un entorno real usaríamos findByIds
        const assetsInMovement = assets.filter(a => movement.activoIds.includes(a.id!));
        for (const activo of assetsInMovement) {
            // Actualizar estado operativo del activo
            activo.aplicarRecepcionDeMovimiento(movement.type, movement.destinationLocationId);
            // Actualizar custodia (responsable) y área
            activo.asignarResponsable(destinationResponsible);
            activo.changeArea(newAreaId);
            
            await this.activoRepository.update(activo);

            // Si el movimiento recibido es de tipo RETORNO_POR_RECHAZO, creamos automáticamente una Ficha de Mantenimiento y su movimiento de ingreso
            if (movement.type === 'RETORNO_POR_RECHAZO') {
                const report = new MaintenanceReport({
                    activoId: activo.id!,
                    modalidad: ModalidadMantenimiento.INTERNO,
                    tipoMantenimiento: TipoMantenimiento.CORRECTIVO,
                    estado: EstadoFicha.PENDIENTE_DIAGNOSTICO,
                    movimientoOrigenId: movement.id!,
                    diagnostico: `Creado automáticamente por reporte de NOVEDAD/RECHAZO en el traslado. Detalles: ${movement.notes || 'Sin detalles'}`
                });
                const savedReport = await this.maintenanceReportRepository.save(report);

                // Registrar movimiento de ingreso a mantenimiento automáticamente
                const ingresoMovement = new Movement({
                    type: 'INGRESO_MANTENIMIENTO',
                    originLocationId: activo.locationId!,
                    destinationLocationId: activo.locationId!,
                    responsibleId: activo.responsibleId!,
                    activoIds: [activo.id!],
                    status: MovementStatus.RECEIVED,
                    shippedAt: new Date(),
                    receivedAt: new Date(),
                    notes: `Ingreso automático a mantenimiento por reporte de NOVEDAD/RECHAZO en el traslado. Ficha #${savedReport.id!.substring(0, 8)}.`
                });
                await this.movementRepository.create(ingresoMovement);
            }
        }
        // 5. Actualizar la ubicación de todas las SIM Cards involucradas
        if (movement.simCardIds && movement.simCardIds.length > 0) {
            const sims = await this.simCardRepository.findAll();
            const simsInMovement = sims.filter(s => movement.simCardIds.includes(s.id!));
            for (const sim of simsInMovement) {
                sim.update({ locationId: movement.destinationLocationId });
                await this.simCardRepository.save(sim);
            }
        }
        // 6. Persistir cambios del movimiento
        const updatedMovement = await this.movementRepository.update(movement);

        // 7. Notificación automática de recepción (con acta/foto adjunta) a los buzones suscritos
        if (this.emailService) {
            try {
                const originLoc = await this.locationRepository.findById(movement.originLocationId);
                const destLoc = await this.locationRepository.findById(movement.destinationLocationId);
                const originResp = await this.responsibleRepository.findById(movement.responsibleId);
                const receiverResp = await this.responsibleRepository.findById(receiverId);

                const assetsDetails = assetsInMovement.map(act => ({
                    placa: act.placa,
                    marca: act.marca,
                    modelo: act.modelo,
                    serial: act.serial
                }));

                await this.emailService.sendMovementReceiptNotification(
                    updatedMovement,
                    {
                        activos: assetsDetails,
                        originLocation: originLoc?.nombre ?? 'Sin sede origen',
                        destinationLocation: destLoc?.nombre ?? 'Sin sede destino',
                        responsibleName: originResp?.nombre ?? 'Sin custodio',
                        receiverName: receiverResp?.nombre ?? movement.physicalReceiverName ?? 'Receptor Destino',
                        receivedEvidenceUrl: receiverEvidenceUrl
                    }
                );
            } catch (mailError) {
                console.error("Error al despachar notificación de recepción:", mailError);
            }
        }

        return updatedMovement;
    }
}
