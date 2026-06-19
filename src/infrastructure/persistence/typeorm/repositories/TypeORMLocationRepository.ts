import { In, Repository } from "typeorm";
import { ResponsibleEntity } from "../entities/ResponsibleEntity";
import { AreaEntity } from "../entities/AreaEntity";
import { Location } from "../../../../domain/entities/Location";
import { ILocationRepository } from "../../../../domain/repositories/ILocationRepository";
import { LocationEntity } from "../entities/LocationEntity";
import { LocationMapper } from "../../mappers/LocationMapper";

export class TypeORMLocationRepository implements ILocationRepository {
    constructor(private readonly repository: Repository<LocationEntity>) { }

    async save(location: Location): Promise<void> {
        const entity = LocationMapper.toPersistence(location);

        if (location.responsibleIds.length > 0) {
            entity.responsibles = await this.repository.manager.find(ResponsibleEntity, {
                where: { id: In(location.responsibleIds) }
            });
        }

        if (location.areas.length > 0) {
            entity.areas = await this.repository.manager.find(AreaEntity, {
                where: { id: In(location.areas.map(a => a.id!)) }
            });
        } else {
            entity.areas = [];
        }

        await this.repository.save(entity);
    }

    async findAll(): Promise<Location[]> {
        const entities = await this.repository.find({
            relations: ['responsibles', 'areas']
        });
        return entities.map(entity => LocationMapper.toDomain(entity));
    }

    async update(location: Location): Promise<void> {
        const entity = LocationMapper.toPersistence(location);

        if (location.responsibleIds.length > 0) {
            entity.responsibles = await this.repository.manager.find(ResponsibleEntity, {
                where: { id: In(location.responsibleIds) }
            });
        } else {
            entity.responsibles = [];
        }

        if (location.areas.length > 0) {
            entity.areas = await this.repository.manager.find(AreaEntity, {
                where: { id: In(location.areas.map(a => a.id!)) }
            });
        } else {
            entity.areas = [];
        }

        await this.repository.save(entity);
    }

    async findByCode(code: string): Promise<Location | null> {
        const entity = await this.repository.findOne({ 
            where: { code },
            relations: ['responsibles', 'areas']
        });
        return entity ? LocationMapper.toDomain(entity) : null;
    }

    async findById(id: string): Promise<Location | null> {
        const entity = await this.repository.findOne({ 
            where: { id },
            relations: ['responsibles', 'areas']
        });
        return entity ? LocationMapper.toDomain(entity) : null;
    }

    async countByResponsibleId(responsibleId: string): Promise<number> {
        return await this.repository
            .createQueryBuilder('location')
            .innerJoin('location.responsibles', 'responsible')
            .where('responsible.id = :responsibleId', { responsibleId })
            .getCount();
    }
}