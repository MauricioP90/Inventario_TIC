import { IMaintenanceReportRepository } from "../../../domain/repositories/IMaintenanceReportRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { MaintenanceReport, ModalidadMantenimiento, TipoMantenimiento } from "../../../domain/entities/MaintenanceReport";
import { EstadoActivo } from "../../../domain/entities/Activo";
import { Movement, MovementStatus } from "../../../domain/entities/Movement";

interface CreateMaintenanceReportInput {
    activoId: string;
    modalidad: ModalidadMantenimiento;
    tipoMantenimiento: TipoMantenimiento;
    movimientoOrigenId?: string;
    costoEstimado?: number;
    tecnicoResponsable?: string;
}

export class CreateMaintenanceReport {
    constructor(
        private readonly maintenanceRepo: IMaintenanceReportRepository,
        private readonly activoRepo: IActivoRepository,
        private readonly movementRepo: IMovementRepository
    ) { }

    async execute(input: CreateMaintenanceReportInput): Promise<MaintenanceReport> {
        const activo = await this.activoRepo.findById(input.activoId);
        if (!activo) throw new Error('Activo no encontrado');
        
        if (activo.estado !== 'MANTENIMIENTO') {
            activo.setStatus(EstadoActivo.MANTENIMIENTO);
            await this.activoRepo.update(activo);
        }

        const report = new MaintenanceReport({
            activoId: input.activoId,
            modalidad: input.modalidad,
            tipoMantenimiento: input.tipoMantenimiento,
            movimientoOrigenId: input.movimientoOrigenId,
            costoEstimado: input.costoEstimado,
            tecnicoResponsable: input.tecnicoResponsable,
        } as any);

        const savedReport = await this.maintenanceRepo.save(report);

        // Registrar movimiento de ingreso a mantenimiento
        const movement = new Movement({
            type: 'INGRESO_MANTENIMIENTO',
            originLocationId: activo.locationId!,
            destinationLocationId: activo.locationId!,
            responsibleId: activo.responsibleId!,
            activoIds: [activo.id!],
            status: MovementStatus.RECEIVED,
            shippedAt: new Date(),
            receivedAt: new Date(),
            notes: `Ingreso a mantenimiento por apertura de ficha #${savedReport.id!.substring(0, 8)}. Modalidad: ${input.modalidad}. Tipo: ${input.tipoMantenimiento}.`
        });
        await this.movementRepo.create(movement);

        return savedReport;
    }
}
