import { Repository } from "typeorm";
import { ISoftwareVersionRepository } from "../../../../domain/repositories/ISoftwareVersionRepository";
import { SoftwareVersion } from "../../../../domain/entities/SoftwareVersion";
import { SoftwareVersionEntity } from "../entities/SoftwareVersionEntity";
import { SoftwareVersionMapper } from "../../mappers/SoftwareVersionMapper";

export class TypeORMSoftwareVersionRepository implements ISoftwareVersionRepository {
    constructor(private readonly repository: Repository<SoftwareVersionEntity>) {}

    async save(version: SoftwareVersion): Promise<void> {
        const entity = SoftwareVersionMapper.toPersistence(version);
        await this.repository.save(entity);
    }

    async findById(id: string): Promise<SoftwareVersion | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? SoftwareVersionMapper.toDomain(entity) : null;
    }

    async findByAppId(softwareAppId: string): Promise<SoftwareVersion[]> {
        const entities = await this.repository.find({
            where: { softwareAppId },
            order: { fechaLanzamiento: 'DESC' }
        });
        return entities.map(e => SoftwareVersionMapper.toDomain(e));
    }

    async findByAppIdAndVersion(softwareAppId: string, version: string): Promise<SoftwareVersion | null> {
        const entity = await this.repository.findOne({
            where: { softwareAppId, version }
        });
        return entity ? SoftwareVersionMapper.toDomain(entity) : null;
    }

    async findVigenteByAppId(softwareAppId: string): Promise<SoftwareVersion | null> {
        const entity = await this.repository.findOne({
            where: { softwareAppId, esVigente: true }
        });
        return entity ? SoftwareVersionMapper.toDomain(entity) : null;
    }

    async update(version: SoftwareVersion): Promise<SoftwareVersion> {
        const entity = SoftwareVersionMapper.toPersistence(version);
        await this.repository.save(entity);
        return SoftwareVersionMapper.toDomain(entity);
    }

    async desmarcarVigentesPorAppId(softwareAppId: string): Promise<void> {
        await this.repository.update({ softwareAppId }, { esVigente: false });
    }
}
