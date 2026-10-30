import { Repository } from "typeorm";
import { IActivoSoftwareRepository } from "../../../../domain/repositories/IActivoSoftwareRepository";
import { ActivoSoftwareHistory } from "../../../../domain/entities/ActivoSoftwareHistory";
import { ActivoSoftwareHistoryEntity } from "../entities/ActivoSoftwareHistoryEntity";
import { ActivoSoftwareHistoryMapper } from "../../mappers/ActivoSoftwareHistoryMapper";

export class TypeORMActivoSoftwareRepository implements IActivoSoftwareRepository {
    constructor(private readonly repository: Repository<ActivoSoftwareHistoryEntity>) {}

    async save(history: ActivoSoftwareHistory): Promise<void> {
        const entity = ActivoSoftwareHistoryMapper.toPersistence(history);
        await this.repository.save(entity);
    }

    async findById(id: string): Promise<ActivoSoftwareHistory | null> {
        const entity = await this.repository.findOne({
            where: { id },
            relations: ["softwareVersion", "softwareVersion.softwareApp"]
        });
        return entity ? ActivoSoftwareHistoryMapper.toDomain(entity) : null;
    }

    async findActiveByActivoId(activoId: string): Promise<ActivoSoftwareHistory[]> {
        const entities = await this.repository.find({
            where: { activoId, estado: 'INSTALADO' },
            relations: ["softwareVersion", "softwareVersion.softwareApp"],
            order: { fechaInstalacion: 'DESC' }
        });
        return entities.map(e => ActivoSoftwareHistoryMapper.toDomain(e));
    }

    async findHistoryByActivoId(activoId: string): Promise<ActivoSoftwareHistory[]> {
        const entities = await this.repository.find({
            where: { activoId },
            relations: ["softwareVersion", "softwareVersion.softwareApp"],
            order: { fechaInstalacion: 'DESC' }
        });
        return entities.map(e => ActivoSoftwareHistoryMapper.toDomain(e));
    }

    async findActiveByActivoAndAppId(activoId: string, softwareAppId: string): Promise<ActivoSoftwareHistory | null> {
        const entity = await this.repository
            .createQueryBuilder("ash")
            .innerJoinAndSelect("ash.softwareVersion", "sv")
            .where("ash.activoId = :activoId", { activoId })
            .andWhere("ash.estado = :estado", { estado: 'INSTALADO' })
            .andWhere("sv.softwareAppId = :softwareAppId", { softwareAppId })
            .getOne();

        return entity ? ActivoSoftwareHistoryMapper.toDomain(entity) : null;
    }

    async update(history: ActivoSoftwareHistory): Promise<ActivoSoftwareHistory> {
        const entity = ActivoSoftwareHistoryMapper.toPersistence(history);
        await this.repository.save(entity);
        return ActivoSoftwareHistoryMapper.toDomain(entity);
    }
}
