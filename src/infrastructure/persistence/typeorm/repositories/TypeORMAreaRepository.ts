import { Repository } from "typeorm";
import { Area } from "../../../../domain/entities/Area";
import { IAreaRepository } from "../../../../domain/repositories/IAreaRepository";
import { AreaEntity } from "../entities/AreaEntity";
import { AreaMapper } from "../../mappers/AreaMapper";

export class TypeORMAreaRepository implements IAreaRepository {
    constructor(private readonly repository: Repository<AreaEntity>) { }

    async create(area: Area): Promise<Area> {
        const entity = AreaMapper.toPersistence(area);
        await this.repository.save(entity);
        return AreaMapper.toDomain(entity);
    }
    async update(area: Area): Promise<Area> {
        const entity = AreaMapper.toPersistence(area);
        await this.repository.save(entity);
        return AreaMapper.toDomain(entity);
    }
    async activate(id: string): Promise<Area> {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) throw new Error('Área no encontrada');
        entity.estado = 'ACTIVO';
        await this.repository.save(entity);
        return AreaMapper.toDomain(entity);
    }
    async inactivate(id: string): Promise<Area> {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) throw new Error('Área no encontrada');
        entity.estado = 'INACTIVO';
        await this.repository.save(entity);
        return AreaMapper.toDomain(entity);
    }
    async findById(id: string): Promise<Area | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? AreaMapper.toDomain(entity) : null;
    }
    async findAll(): Promise<Area[]> {
        const entities = await this.repository.find({ order: { code: 'ASC' } });
        return entities.map(entity => AreaMapper.toDomain(entity));
    }
}
