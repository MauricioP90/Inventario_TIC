import { Activo, EstadoActivo } from "../../../domain/entities/Activo";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { Responsible } from "../../../domain/entities/Responsible";
import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { Movement, MovementStatus } from "../../../domain/entities/Movement";
import { IMaintenanceReportRepository } from "../../../domain/repositories/IMaintenanceReportRepository";
import { MaintenanceReport, ModalidadMantenimiento, TipoMantenimiento } from "../../../domain/entities/MaintenanceReport";

import { AppDataSource } from "../../../data-source";
import { ActivoDocumentHistoryEntity } from "../../../infrastructure/persistence/typeorm/entities/ActivoDocumentHistoryEntity";

interface UpdateActivoInput {
    placa: string;
    tipoActivoId?: string;
    marca?: string;
    modelo?: string;
    serial?: string;
    estado?: EstadoActivo;
    facturaUrl?: string;
    locationId?: string;
    responsibleId?: string;
    areaId?: string;
    fechaIngreso?: Date | string;
    precioCompra?: number;
    changedByUser?: string;
    justification?: string;
    maintenanceModalidad?: ModalidadMantenimiento;
    maintenanceTipo?: TipoMantenimiento;
    maintenanceCostoEstimado?: number;
    maintenanceTecnicoResponsable?: string;
}

export class UpdateActivo {
    constructor(
        private readonly activoRepository: IActivoRepository,
        private readonly locationRepository: ILocationRepository,
        private readonly responsibleRepository: IResponsibleRepository,
        private readonly movementRepository: IMovementRepository,
        private readonly maintenanceRepository: IMaintenanceReportRepository
    ) { }

    async execute(input: UpdateActivoInput): Promise<Activo> {
        const activo = await this.activoRepository.findByPlaca(input.placa);
        if (!activo) throw new Error('Activo no encontrado');

        // Buscar movimientos asociados
        const movements = await this.movementRepository.findAllByActivoId(activo.id!);
        const activeMovements = movements.filter(m => 
            m.status === MovementStatus.PENDING || 
            m.status === MovementStatus.EN_TRANSIT
        );

        if (activeMovements.length > 0) {
            const hasLocationChange = input.locationId && input.locationId !== activo.locationId;
            const hasResponsibleChange = input.responsibleId && input.responsibleId !== activo.responsibleId;
            const hasEstadoChange = input.estado && input.estado !== activo.estado;
            const hasAreaChange = input.areaId && input.areaId !== activo.areaId;

            if (hasLocationChange || hasResponsibleChange || hasEstadoChange || hasAreaChange) {
                throw new Error('No se puede modificar el estado, ubicación, responsable o área del activo porque tiene traslados activos en curso.');
            }
        }

        let targetLocationId = input.locationId !== undefined ? input.locationId : activo.locationId;

        // Validar áreas de la sede
        if (targetLocationId) {
            const location = await this.locationRepository.findById(targetLocationId);
            if (location) {
                const hasAreas = location.areas && location.areas.length > 0;
                if (hasAreas) {
                    const validAreaIds = location.areas.map(a => a.id);
                    if (input.areaId !== undefined && !validAreaIds.includes(input.areaId)) {
                        throw new Error(`El área seleccionada no está habilitada para la sede "${location.nombre}".`);
                    }
                    if (input.areaId === undefined && !validAreaIds.includes(activo.areaId)) {
                        const respId = input.responsibleId || activo.responsibleId;
                        if (respId) {
                            const resp = await this.responsibleRepository.findById(respId);
                            if (resp && resp.area && validAreaIds.includes(resp.area.id!)) {
                                activo.changeArea(resp.area.id!);
                            } else {
                                activo.changeArea(validAreaIds[0]!);
                            }
                        } else {
                            activo.changeArea(validAreaIds[0]!);
                        }
                    }
                } else {
                    activo.changeArea('8b8b9c8c-1e2a-43cf-8a27-024848bb0000'); // NO APLICA
                }
            }
        }

        if (input.areaId !== undefined) {
            if (targetLocationId) {
                const location = await this.locationRepository.findById(targetLocationId);
                const hasAreas = location && location.areas && location.areas.length > 0;
                if (hasAreas) {
                    activo.changeArea(input.areaId);
                } else {
                    activo.changeArea('8b8b9c8c-1e2a-43cf-8a27-024848bb0000');
                }
            } else {
                activo.changeArea(input.areaId);
            }
        }

        if (input.locationId) {
            const location = await this.locationRepository.findById(input.locationId);
            if (!location) throw new Error('Ubicación no encontrada');
            activo.asignarUbicacion(location);
        }

        const oldEstado = activo.estado;
        const targetEstado = input.estado !== undefined ? input.estado : activo.estado;
        targetLocationId = input.locationId !== undefined ? input.locationId : activo.locationId;

        // Regla de Bloqueo: Si estaba en MANTENIMIENTO y quiere salir de él, verificar si tiene una ficha activa
        if (oldEstado === EstadoActivo.MANTENIMIENTO && targetEstado !== EstadoActivo.MANTENIMIENTO) {
            const activeReports = await this.maintenanceRepository.findAllActive();
            const hasActiveReport = activeReports.some(r => r.activoId === activo.id);
            if (hasActiveReport) {
                throw new Error('No se puede cambiar el estado del activo porque tiene una ficha de mantenimiento activa. Debe finalizar o cerrar la ficha en el módulo de mantenimiento.');
            }
        }

        if (targetEstado === EstadoActivo.MANTENIMIENTO && targetLocationId) {
            const location = await this.locationRepository.findById(targetLocationId);
            if (location && location.tipo !== 'BODEGA' && location.tipo !== 'PROVEEDOR') {
                throw new Error('Un activo solo puede estar en estado MANTENIMIENTO si se encuentra en una Bodega o Proveedor.');
            }
        }

        if (input.responsibleId) {
            const responsible = await this.responsibleRepository.findById(input.responsibleId);
            if (!responsible) throw new Error('Responsable no encontrado');

            if (targetLocationId && !responsible.locationIds.includes(targetLocationId)) {
                throw new Error('Conflicto: El responsable seleccionado no tiene permisos asignados en la sede a la cual está vinculado este activo.');
            }

            activo.asignarResponsable(responsible);
        }

        const oldFacturaUrl = activo.facturaUrl;
        const oldPrecioCompra = activo.precioCompra;

        const hasFacturaChange = input.facturaUrl !== undefined && input.facturaUrl !== oldFacturaUrl;
        const hasPrecioChange = input.precioCompra !== undefined && input.precioCompra !== oldPrecioCompra;

        if (hasFacturaChange || hasPrecioChange) {
            if (oldFacturaUrl && hasFacturaChange && !input.justification) {
                throw new Error('Se requiere una justificación de auditoría obligatoria para reemplazar o modificar la factura de compra existente.');
            }

            const historyRepo = AppDataSource.getRepository(ActivoDocumentHistoryEntity);
            await historyRepo.save({
                activoId: activo.id!,
                previousFacturaUrl: oldFacturaUrl,
                newFacturaUrl: input.facturaUrl !== undefined ? input.facturaUrl : oldFacturaUrl,
                previousPrecioCompra: oldPrecioCompra,
                newPrecioCompra: input.precioCompra !== undefined ? input.precioCompra : oldPrecioCompra,
                changedByUser: input.changedByUser || 'Usuario Autenticado',
                justification: input.justification || (hasFacturaChange ? 'Actualización de soporte / factura' : 'Actualización de precio de compra')
            });
        }

        activo.update({
            ...(input.tipoActivoId && { tipoActivoId: input.tipoActivoId }),
            ...(input.marca && { marca: input.marca }),
            ...(input.modelo && { modelo: input.modelo }),
            ...(input.serial && { serial: input.serial }),
            ...(input.estado && { estado: input.estado }),
            ...(input.precioCompra !== undefined && { precioCompra: input.precioCompra }),
            ...(input.facturaUrl !== undefined && { facturaUrl: input.facturaUrl })
        });

        await this.activoRepository.save(activo);

        // Si el estado es MANTENIMIENTO, nos aseguramos de que exista una ficha de trabajo activa
        if (targetEstado === EstadoActivo.MANTENIMIENTO) {
            const activeReports = await this.maintenanceRepository.findAllActive();
            const hasActiveReport = activeReports.some(r => r.activoId === activo.id);
            if (!hasActiveReport) {
                const report = new MaintenanceReport({
                    activoId: activo.id!,
                    modalidad: input.maintenanceModalidad || ModalidadMantenimiento.INTERNO,
                    tipoMantenimiento: input.maintenanceTipo || TipoMantenimiento.CORRECTIVO,
                    costoEstimado: input.maintenanceCostoEstimado,
                    tecnicoResponsable: input.maintenanceTecnicoResponsable,
                } as any);
                const savedReport = await this.maintenanceRepository.save(report);

                // Registrar movimiento de ingreso a mantenimiento
                const movement = new Movement({
                    type: 'INGRESO_MANTENIMIENTO',
                    originLocationId: targetLocationId || activo.locationId!,
                    destinationLocationId: targetLocationId || activo.locationId!,
                    responsibleId: input.responsibleId || activo.responsibleId!,
                    activoIds: [activo.id!],
                    status: MovementStatus.RECEIVED,
                    shippedAt: new Date(),
                    receivedAt: new Date(),
                    notes: `Ingreso a mantenimiento por cambio manual de estado en edición de activo. Ficha autogenerada: #${savedReport.id!.substring(0, 8)}.`
                });
                await this.movementRepository.create(movement);
            } else if (oldEstado !== EstadoActivo.MANTENIMIENTO) {
                // Si ya tenía ficha activa pero el activo no estaba en estado MANTENIMIENTO por alguna razón, igual logueamos ingreso
                const movement = new Movement({
                    type: 'INGRESO_MANTENIMIENTO',
                    originLocationId: targetLocationId || activo.locationId!,
                    destinationLocationId: targetLocationId || activo.locationId!,
                    responsibleId: input.responsibleId || activo.responsibleId!,
                    activoIds: [activo.id!],
                    status: MovementStatus.RECEIVED,
                    shippedAt: new Date(),
                    receivedAt: new Date(),
                    notes: `Ingreso a mantenimiento por cambio manual de estado en edición de activo (ya contaba con una ficha activa).`
                });
                await this.movementRepository.create(movement);
            }
        }

        // Si sale de MANTENIMIENTO manualmente
        if (oldEstado === EstadoActivo.MANTENIMIENTO && targetEstado !== EstadoActivo.MANTENIMIENTO) {
            const movement = new Movement({
                type: 'SALIDA_MANTENIMIENTO',
                originLocationId: targetLocationId || activo.locationId!,
                destinationLocationId: targetLocationId || activo.locationId!,
                responsibleId: input.responsibleId || activo.responsibleId!,
                activoIds: [activo.id!],
                status: MovementStatus.RECEIVED,
                shippedAt: new Date(),
                receivedAt: new Date(),
                notes: `Salida de mantenimiento por cambio manual de estado en edición de activo a: ${targetEstado}.`
            });
            await this.movementRepository.create(movement);
        }

        return activo;
    }
}