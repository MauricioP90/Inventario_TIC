import { Repository } from "typeorm";
import { MaintenanceReport, EstadoFicha } from "../../../../domain/entities/MaintenanceReport";
import { IMaintenanceReportRepository } from "../../../../domain/repositories/IMaintenanceReportRepository";
import { MaintenanceReportEntity } from "../entities/MaintenanceReportEntity";
import { MaintenanceReportMapper } from "../../mappers/MaintenanceReportMapper";
import { Not } from "typeorm";

export class TypeORMMaintenanceReportRepository implements IMaintenanceReportRepository {
    constructor(private readonly repository: Repository<MaintenanceReportEntity>) { }

    async save(report: MaintenanceReport): Promise<MaintenanceReport> {
        const entity = MaintenanceReportMapper.toPersistence(report);
        const saved = await this.repository.save(entity);
        return MaintenanceReportMapper.toDomain(saved);
    }

    async findById(id: string): Promise<MaintenanceReport | null> {
        const entity = await this.repository.findOne({
            where: { id },
            relations: ['activo', 'activo.tipoActivo', 'activo.location']
        });
        return entity ? MaintenanceReportMapper.toDomain(entity) : null;
    }

    async findByActivoId(activoId: string): Promise<MaintenanceReport[]> {
        const entities = await this.repository.find({
            where: { activoId },
            order: { fechaApertura: 'DESC' }
        });
        return entities.map(e => MaintenanceReportMapper.toDomain(e));
    }

    async findAllActive(): Promise<MaintenanceReport[]> {
        const entities = await this.repository.find({
            where: { estado: Not(EstadoFicha.CERRADO) },
            relations: ['activo', 'activo.tipoActivo', 'activo.location'],
            order: { fechaApertura: 'ASC' }
        });
        return entities.map(e => MaintenanceReportMapper.toDomain(e));
    }

    async findAll(): Promise<MaintenanceReport[]> {
        const entities = await this.repository.find({
            relations: ['activo', 'activo.tipoActivo', 'activo.location'],
            order: { fechaApertura: 'DESC' }
        });
        return entities.map(e => MaintenanceReportMapper.toDomain(e));
    }
}
