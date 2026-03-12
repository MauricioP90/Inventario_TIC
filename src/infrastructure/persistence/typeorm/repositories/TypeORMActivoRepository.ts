import { Repository } from "typeorm";
import { Activo } from "../../../../domain/entities/Activo";
import { IActivoRepository } from "../../../../domain/repositories/IActivoRepository";
import { ActivoEntity } from "../../../persistence/typeorm/entities/ActivoEntity";
import { ActivoMapper } from "../../mappers/ActivoMapper";

export class TypeORMActivoRepository implements IActivoRepository {
    constructor(private readonly repository: Repository<ActivoEntity>) { }

    async save(activo: Activo): Promise<void> {
        const entity = ActivoMapper.toPersistence(activo);
        await this.repository.save(entity);
    }

    async findByPlaca(placa: string): Promise<Activo | null> {
        // Esta es la parte clave para el negocio: buscar por placa
        const entity = await this.repository.findOne({ where: { placa } });
        return entity ? ActivoMapper.toDomain(entity) : null;
    }
    async findAll(): Promise<Activo[]> {
        const entities = await this.repository.find();
        return entities.map(ActivoMapper.toDomain);
    }
}