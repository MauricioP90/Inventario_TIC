import { In, Repository } from "typeorm";
import { Movement } from "../../../../domain/entities/Movement";
import { IMovementRepository } from "../../../../domain/repositories/IMovementRepository";
import { MovementEntity } from "../entities/MovementEntity";
import { ActivoEntity } from "../entities/ActivoEntity";
import { MovementMapper } from "../../../mappers/MovementMapper";

export class TypeORMMovementRepository implements IMovementRepository {
    constructor(private readonly repository: Repository<MovementEntity>) { }

    async create(movement: Movement): Promise<Movement> {
        const entity = MovementMapper.toPersistence(movement);

        if (movement.activoIds.length > 0) {
            entity.activos = await this.repository.manager.find(ActivoEntity, {
                where: { id: In(movement.activoIds) }
            });
        }

        const savedEntity = await this.repository.save(entity);
        return MovementMapper.toDomain(savedEntity);
    }

    async update(movement: Movement): Promise<Movement> {
        const entity = MovementMapper.toPersistence(movement);

        if (movement.activoIds.length > 0) {
            entity.activos = await this.repository.manager.find(ActivoEntity, {
                where: { id: In(movement.activoIds) }
            });
        }

        const updatedEntity = await this.repository.save(entity);
        return MovementMapper.toDomain(updatedEntity);
    }

    async findById(id: string): Promise<Movement | null> {
        const entity = await this.repository.findOne({
            where: { id },
            relations: ['activos', 'originLocation', 'destinationLocation', 'responsible']
        });

        return entity ? MovementMapper.toDomain(entity) : null;
    }

    async findAllByActivoId(activoId: string): Promise<Movement[]> {
        const entities = await this.repository.createQueryBuilder('movement')
            .innerJoin('movement.activos', 'activo')
            .where('activo.id = :activoId', { activoId })
            .leftJoinAndSelect('movement.activos', 'activos')
            .leftJoinAndSelect('movement.originLocation', 'originLocation')
            .leftJoinAndSelect('movement.destinationLocation', 'destinationLocation')
            .leftJoinAndSelect('movement.responsible', 'responsible')
            .orderBy('movement.created_at', 'DESC')
            .getMany();

        return entities.map(entity => MovementMapper.toDomain(entity));
    }

    async findAllByLocationId(locationId: string): Promise<Movement[]> {
         const entities = await this.repository.find({
            where: [
                { originLocationId: locationId },
                { destinationLocationId: locationId }
            ],
            relations: ['activos', 'originLocation', 'destinationLocation', 'responsible'],
            order: { createdAt: 'DESC' }
        });

        return entities.map(entity => MovementMapper.toDomain(entity));
    }

    async findAll(): Promise<Movement[]> {
        const entities = await this.repository.find({
            relations: ['activos', 'originLocation', 'destinationLocation', 'responsible'],
            order: { createdAt: 'DESC' }
        });

        return entities.map(entity => MovementMapper.toDomain(entity));
    }
}
