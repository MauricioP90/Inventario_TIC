import { Repository } from "typeorm";
import { ITipoActivoRepository } from "../../../../domain/repositories/ITipoActivoRepository";
import { TipoActivo } from "../../../../domain/entities/TipoActivo";
import { TipoActivoEntity } from "../entities/TipoActivoEntity";
import { TipoActivoMapper } from "../../mappers/TipoActivoMapper";

export class TypeORMTipoActivoRepository implements ITipoActivoRepository {
    constructor(private readonly repository: Repository<TipoActivoEntity>) { }
    async save(tipo: TipoActivo): Promise<void> {
        const entity = TipoActivoMapper.toPersistence(tipo);
        await this.repository.save(entity);
    }
    async findAll(): Promise<TipoActivo[]> {
        const entities = await this.repository.find();
        return entities.map(entity => TipoActivoMapper.toDomain(entity));
    }
    async findById(id: string): Promise<TipoActivo | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? TipoActivoMapper.toDomain(entity) : null;
    }
    async update(tipo: TipoActivo): Promise<TipoActivo> {
        const entity = TipoActivoMapper.toPersistence(tipo);
        await this.repository.save(entity);
        return TipoActivoMapper.toDomain(entity);
    }
}
