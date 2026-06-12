import { IMaintenanceReportRepository } from "../../../domain/repositories/IMaintenanceReportRepository";

export class GetMaintenanceHistory {
    constructor(private readonly maintenanceRepo: IMaintenanceReportRepository) { }

    async execute(activoId?: string): Promise<any[]> {
        const reports = activoId
            ? await this.maintenanceRepo.findByActivoId(activoId)
            : await this.maintenanceRepo.findAll();
        return reports.map(r => r.toJSON());
    }
}
