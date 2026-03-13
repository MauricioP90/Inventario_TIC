import { DataSource, Repository } from "typeorm";
import { Location } from "../../../../domain/entities/Location";
import { ILocationRepository } from "../../../../domain/repositories/ILocationRepository";
import { LocationEntity } from "../entities/LocationEntity";
import { LocationMapper } from "../../mappers/LocationMapper";

export class TypeORMLocationRepository implements ILocationRepository {
    constructor(private readonly repository: Repository<LocationEntity>) { }

    async save(location: Location): Promise<void> {
        const entity = LocationMapper.toPersistence(location);
        await this.repository.save(entity);
    }

    async findById(id: string): Promise<Location | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? LocationMapper.toDomain(entity) : null;
    }

    async findAll(): Promise<Location[]> {
        const entities = await this.repository.find();
        return entities.map(entity => LocationMapper.toDomain(entity));
    }

    async update(location: Location): Promise<void> {
        const entity = LocationMapper.toPersistence(location);
        await this.repository.save(entity);
    }
}