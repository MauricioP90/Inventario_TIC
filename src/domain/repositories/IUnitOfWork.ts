import { IMovementRepository } from "./IMovementRepository";
import { IActivoRepository } from "./IActivoRepository";
import { ISIMCardRepository } from "./ISIMCardRepository";
import { IMaintenanceReportRepository } from "./IMaintenanceReportRepository";

export interface TransactionRepositories {
    movementRepository: IMovementRepository;
    activoRepository: IActivoRepository;
    simCardRepository: ISIMCardRepository;
    maintenanceReportRepository: IMaintenanceReportRepository;
}

export interface IUnitOfWork {
    runInTransaction<T>(work: (repos: TransactionRepositories) => Promise<T>): Promise<T>;
}
