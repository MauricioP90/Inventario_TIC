import { MaintenanceReport } from '../entities/MaintenanceReport';

export interface IMaintenanceReportRepository {
    save(report: MaintenanceReport): Promise<MaintenanceReport>;
    findById(id: string): Promise<MaintenanceReport | null>;
    findByActivoId(activoId: string): Promise<MaintenanceReport[]>;
    findAllActive(): Promise<MaintenanceReport[]>;
    findAll(): Promise<MaintenanceReport[]>;
}
