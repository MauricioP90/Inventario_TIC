import { DataSource, EntityManager } from "typeorm";
import { IUnitOfWork, TransactionRepositories } from "../../../domain/repositories/IUnitOfWork";
import { TypeORMMovementRepository } from "./repositories/TypeORMMovementRepository";
import { TypeORMActivoRepository } from "./repositories/TypeORMActivoRepository";
import { TypeORMSIMCardRepository } from "./repositories/TypeORMSIMCardRepository";
import { TypeORMMaintenanceReportRepository } from "./repositories/TypeORMMaintenanceReportRepository";
import { MovementEntity } from "./entities/MovementEntity";
import { ActivoEntity } from "./entities/ActivoEntity";
import { SIMCardEntity } from "./entities/SIMCardEntity";
import { MaintenanceReportEntity } from "./entities/MaintenanceReportEntity";

export class TypeORMUnitOfWork implements IUnitOfWork {
    constructor(private readonly dataSource: DataSource) { }

    async runInTransaction<T>(work: (repos: TransactionRepositories) => Promise<T>): Promise<T> {
        return await this.dataSource.transaction(async (manager: EntityManager) => {
            const repos: TransactionRepositories = {
                movementRepository: new TypeORMMovementRepository(manager.getRepository(MovementEntity)),
                activoRepository: new TypeORMActivoRepository(manager.getRepository(ActivoEntity)),
                simCardRepository: new TypeORMSIMCardRepository(manager.getRepository(SIMCardEntity)),
                maintenanceReportRepository: new TypeORMMaintenanceReportRepository(manager.getRepository(MaintenanceReportEntity))
            };
            return await work(repos);
        });
    }
}
