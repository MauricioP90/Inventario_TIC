import { Repository } from "typeorm";
import { ISoftwareAppRepository } from "../../../../domain/repositories/ISoftwareAppRepository";
import { SoftwareApp } from "../../../../domain/entities/SoftwareApp";
import { SoftwareAppEntity } from "../entities/SoftwareAppEntity";
import { SoftwareAppMapper } from "../../mappers/SoftwareAppMapper";

export class TypeORMSoftwareAppRepository implements ISoftwareAppRepository {
    constructor(private readonly repository: Repository<SoftwareAppEntity>) {}

    async save(app: SoftwareApp): Promise<void> {
        const entity = SoftwareAppMapper.toPersistence(app);
        await this.repository.save(entity);
    }

    async findById(id: string): Promise<SoftwareApp | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? SoftwareAppMapper.toDomain(entity) : null;
    }

    async findByNombre(nombre: string): Promise<SoftwareApp | null> {
        const entity = await this.repository.findOne({ where: { nombre } });
        return entity ? SoftwareAppMapper.toDomain(entity) : null;
    }

    async findAll(): Promise<SoftwareApp[]> {
        const entities = await this.repository.find({ order: { nombre: 'ASC' } });
        return entities.map(e => SoftwareAppMapper.toDomain(e));
    }

    async update(app: SoftwareApp): Promise<SoftwareApp> {
        const entity = SoftwareAppMapper.toPersistence(app);
        await this.repository.save(entity);
        return SoftwareAppMapper.toDomain(entity);
    }
}
