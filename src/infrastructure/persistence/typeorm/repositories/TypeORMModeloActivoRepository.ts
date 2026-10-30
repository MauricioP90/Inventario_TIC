import { Repository } from "typeorm";
import { IModeloActivoRepository } from "../../../../domain/repositories/IModeloActivoRepository";
import { ModeloActivo } from "../../../../domain/entities/ModeloActivo";
import { ModeloActivoEntity } from "../entities/ModeloActivoEntity";
import { ModeloActivoMapper } from "../../mappers/ModeloActivoMapper";

export class TypeORMModeloActivoRepository implements IModeloActivoRepository {
    constructor(private readonly repository: Repository<ModeloActivoEntity>) {}

    async save(modelo: ModeloActivo): Promise<void> {
        const entity = ModeloActivoMapper.toPersistence(modelo);
        await this.repository.save(entity);
    }

    async findAll(): Promise<ModeloActivo[]> {
        const entities = await this.repository.find({
            order: { marca: 'ASC', modelo: 'ASC' }
        });
        return entities.map(e => ModeloActivoMapper.toDomain(e));
    }

    async findByTipoActivoId(tipoActivoId: string): Promise<ModeloActivo[]> {
        const entities = await this.repository.find({
            where: { tipoActivoId },
            order: { marca: 'ASC', modelo: 'ASC' }
        });
        return entities.map(e => ModeloActivoMapper.toDomain(e));
    }

    async findById(id: string): Promise<ModeloActivo | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? ModeloActivoMapper.toDomain(entity) : null;
    }

    async update(modelo: ModeloActivo): Promise<ModeloActivo> {
        const entity = ModeloActivoMapper.toPersistence(modelo);
        await this.repository.save(entity);
        return ModeloActivoMapper.toDomain(entity);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
