import { In, Repository } from "typeorm";
import { Movement } from "../../../../domain/entities/Movement";
import { IMovementRepository } from "../../../../domain/repositories/IMovementRepository";
import { MovementEntity } from "../entities/MovementEntity";
import { ActivoEntity } from "../entities/ActivoEntity";
import { SIMCardEntity } from "../entities/SIMCardEntity";
import { MovementMapper } from "../../mappers/MovementMapper";

export class TypeORMMovementRepository implements IMovementRepository {
    constructor(private readonly repository: Repository<MovementEntity>) { }

    async create(movement: Movement): Promise<Movement> {
        const entity = MovementMapper.toPersistence(movement);

        if (movement.activoIds.length > 0) {
            entity.activos = await this.repository.manager.find(ActivoEntity, {
                where: { id: In(movement.activoIds) }
            });
        }

        if (movement.simCardIds.length > 0) {
            entity.simCards = await this.repository.manager.find(SIMCardEntity, {
                where: { id: In(movement.simCardIds) }
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

        if (movement.simCardIds.length > 0) {
            entity.simCards = await this.repository.manager.find(SIMCardEntity, {
                where: { id: In(movement.simCardIds) }
            });
        }

        const updatedEntity = await this.repository.save(entity);

        // TypeORM omite los NULL en save() cuando la entidad no fue cargada desde DB.
        // Usamos una query directa para forzar magic_link_token = NULL cuando el token fue consumido.
        if (movement.magicLinkToken === undefined || movement.magicLinkToken === null) {
            await this.repository.query(
                'UPDATE movements SET magic_link_token = NULL WHERE id = $1',
                [movement.id]
            );
        }

        return MovementMapper.toDomain(updatedEntity);
    }

    async findById(id: string): Promise<Movement | null> {
        const entity = await this.repository.findOne({
            where: { id },
            relations: ['activos', 'activos.simCards', 'simCards', 'originLocation', 'destinationLocation', 'responsible', 'responsible.role', 'receiver', 'receiver.role']
        });

        return entity ? MovementMapper.toDomain(entity) : null;
    }

    async findAllByActivoId(activoId: string): Promise<Movement[]> {
        const entities = await this.repository.createQueryBuilder('movement')
            .innerJoin('movement.activos', 'activo')
            .where('activo.id = :activoId', { activoId })
            .leftJoinAndSelect('movement.activos', 'activos')
            .leftJoinAndSelect('activos.simCards', 'simCards')
            .leftJoinAndSelect('movement.originLocation', 'originLocation')
            .leftJoinAndSelect('movement.destinationLocation', 'destinationLocation')
            .leftJoinAndSelect('movement.responsible', 'responsible')
            .leftJoinAndSelect('responsible.role', 'responsibleRole')
            .leftJoinAndSelect('movement.receiver', 'receiver')
            .leftJoinAndSelect('receiver.role', 'receiverRole')
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
            relations: ['activos', 'activos.simCards', 'simCards', 'originLocation', 'destinationLocation', 'responsible', 'responsible.role', 'receiver', 'receiver.role'],
            order: { createdAt: 'DESC' }
        });

        return entities.map(entity => MovementMapper.toDomain(entity));
    }

    async findAll(): Promise<Movement[]> {
        const entities = await this.repository.find({
            relations: ['activos', 'activos.simCards', 'simCards', 'originLocation', 'destinationLocation', 'responsible', 'responsible.role', 'receiver', 'receiver.role'],
            order: { createdAt: 'DESC' }
        });

        return entities.map(entity => MovementMapper.toDomain(entity));
    }

    async findByMagicLinkToken(token: string): Promise<Movement | null> {
        const entity = await this.repository.findOne({
            where: { magicLinkToken: token },
            relations: ['activos', 'activos.simCards', 'simCards', 'originLocation', 'destinationLocation', 'responsible', 'responsible.role', 'receiver', 'receiver.role']
        });

        return entity ? MovementMapper.toDomain(entity) : null;
    }
}
