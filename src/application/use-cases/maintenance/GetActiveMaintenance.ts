import { IMaintenanceReportRepository } from "../../../domain/repositories/IMaintenanceReportRepository";

export class GetActiveMaintenance {
    constructor(private readonly maintenanceRepo: IMaintenanceReportRepository) { }

    async execute(): Promise<any[]> {
        const reports = await this.maintenanceRepo.findAllActive();
        return reports.map(r => r.toJSON());
    }
}
