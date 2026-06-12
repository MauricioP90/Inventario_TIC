import { IMaintenanceReportRepository } from "../../../domain/repositories/IMaintenanceReportRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { MaintenanceReport, ModalidadMantenimiento, TipoMantenimiento } from "../../../domain/entities/MaintenanceReport";
import { EstadoActivo } from "../../../domain/entities/Activo";

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
        private readonly activoRepo: IActivoRepository
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

        return this.maintenanceRepo.save(report);
    }
}
