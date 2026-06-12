import { Activo, EstadoActivo } from "../../../domain/entities/Activo";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { Responsible } from "../../../domain/entities/Responsible";
import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { MovementStatus } from "../../../domain/entities/Movement";
import { IMaintenanceReportRepository } from "../../../domain/repositories/IMaintenanceReportRepository";
import { MaintenanceReport, ModalidadMantenimiento, TipoMantenimiento } from "../../../domain/entities/MaintenanceReport";

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
    fechaIngreso?: Date | string;
    precioCompra?: number;
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

            if (hasLocationChange || hasResponsibleChange || hasEstadoChange) {
                throw new Error('No se puede modificar el estado, ubicación o responsable del activo porque tiene traslados activos en curso.');
            }
        }

        if (input.locationId) {
            const location = await this.locationRepository.findById(input.locationId);
            if (!location) throw new Error('Ubicación no encontrada');
            activo.asignarUbicacion(location);
        }

        const oldEstado = activo.estado;
        const targetEstado = input.estado !== undefined ? input.estado : activo.estado;
        const targetLocationId = input.locationId !== undefined ? input.locationId : activo.locationId;
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

        activo.update({
            ...(input.tipoActivoId && { tipoActivoId: input.tipoActivoId }),
            ...(input.marca && { marca: input.marca }),
            ...(input.modelo && { modelo: input.modelo }),
            ...(input.serial && { serial: input.serial }),
            ...(input.estado && { estado: input.estado }),
            ...(input.fechaIngreso && { fechaIngreso: new Date(input.fechaIngreso) }),
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
                await this.maintenanceRepository.save(report);
            }
        }

        return activo;
    }
}