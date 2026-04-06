import { In, Repository } from "typeorm";
import { LocationEntity } from "../entities/LocationEntity";
import { Responsible } from "../../../../domain/entities/Responsible";
import { IResponsibleRepository } from "../../../../domain/repositories/IResponsibleRepository";
import { ResponsibleEntity } from "../entities/ResponsibleEntity";
import { ResponsibleMapper } from "../../mappers/ResponsibleMapper";


export class TypeORMResponsibleRepository implements IResponsibleRepository {
    constructor(private readonly repository: Repository<ResponsibleEntity>) { }

    async create(responsible: Responsible): Promise<Responsible> {
        const entity = ResponsibleMapper.toPersistence(responsible);

        if (responsible.locationIds.length > 0) {
            entity.locations = await this.repository.manager.find(LocationEntity, {
                where: { id: In(responsible.locationIds) }
            });
        }

        const savedEntity = await this.repository.save(entity);
        return ResponsibleMapper.toDomain(savedEntity);
    }

    async update(responsible: Responsible): Promise<Responsible> {
        const entity = ResponsibleMapper.toPersistence(responsible);

        if (responsible.locationIds.length > 0) {
            entity.locations = await this.repository.manager.find(LocationEntity, {
                where: { id: In(responsible.locationIds) }
            });
        } else {
            entity.locations = []; // Limpiar asignaciones si el array viene vacío
        }

        const updatedEntity = await this.repository.save(entity);
        return ResponsibleMapper.toDomain(updatedEntity);
    }

    async findAll(): Promise<Responsible[]> {
        const entities = await this.repository.createQueryBuilder('responsible')
            .leftJoinAndSelect('responsible.locations', 'locations')
            .leftJoinAndSelect('responsible.activos', 'activos')
            .leftJoinAndSelect('activos.simCards', 'simCards')
            .leftJoinAndSelect('responsible.role', 'role')
            .getMany();

        return entities.map(entity => {
            // Cálculo en memoria temporal para evitar subqueries complejas que fallan en TypeORM
            entity.activosCount = entity.activos?.length || 0;
            entity.simCardsCount = entity.activos?.reduce((sum, act) => sum + (act.simCards?.length || 0), 0) || 0;
            return ResponsibleMapper.toDomain(entity);
        });
    }

    async findById(id: string): Promise<Responsible | null> {
        const entity = await this.repository.createQueryBuilder('responsible')
            .leftJoinAndSelect('responsible.locations', 'locations')
            .leftJoinAndSelect('responsible.activos', 'activos')
            .leftJoinAndSelect('activos.simCards', 'simCards')
            .leftJoinAndSelect('responsible.role', 'role')
            .where('responsible.id = :id', { id })
            .getOne();

        if (entity) {
            entity.activosCount = entity.activos?.length || 0;
            entity.simCardsCount = entity.activos?.reduce((sum, act) => sum + (act.simCards?.length || 0), 0) || 0;
            return ResponsibleMapper.toDomain(entity);
        }
        return null;
    }

    async findByNombre(nombre: string): Promise<Responsible | null> {
        const entity = await this.repository.findOne({
            where: { nombre },
            relations: ['locations']
        });
        return entity ? ResponsibleMapper.toDomain(entity) : null;
    }

    async findByLocation(locationId: string): Promise<Responsible[]> {
        const entities = await this.repository
            .createQueryBuilder('responsible')
            .innerJoin('responsible.locations', 'location')
            .where('location.id = :locationId', { locationId })
            .getMany();

        return entities.map(entity => ResponsibleMapper.toDomain(entity));
    }
}
