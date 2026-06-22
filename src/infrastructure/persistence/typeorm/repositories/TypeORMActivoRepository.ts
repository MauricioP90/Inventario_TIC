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
        const entity = await this.repository.findOne({ where: { placa }, relations: ['location', 'location.areas', 'responsible', 'responsible.role', 'responsible.area', 'tipoActivo', 'simCards', 'area'] });
        return entity ? ActivoMapper.toDomain(entity) : null;
    }
    async findAll(): Promise<Activo[]> {
        const entities = await this.repository.find({ relations: ['location', 'location.areas', 'responsible', 'responsible.role', 'responsible.area', 'tipoActivo', 'simCards', 'area'] });
        return entities.map(ActivoMapper.toDomain)
    }

    async findBySerial(serial: string): Promise<Activo | null> {
        const entity = await this.repository.findOne({ where: { serial }, relations: ['location', 'location.areas', 'responsible', 'responsible.role', 'responsible.area', 'tipoActivo', 'simCards', 'area'] });
        return entity ? ActivoMapper.toDomain(entity) : null;
    }

    async update(activo: Activo): Promise<Activo> {
        const entity = ActivoMapper.toPersistence(activo);
        await this.repository.save(entity);
        // Volver a buscar con relaciones cargadas para no perder datos al retornar
        const reloaded = await this.findById(entity.id);
        return reloaded || ActivoMapper.toDomain(entity);
    }

    async countByResponsibleId(responsibleId: string): Promise<number> {
        return this.repository.count({ where: { responsibleId } });
    }

    async findById(id: string): Promise<Activo | null> {
        const entity = await this.repository.findOne({ where: { id }, relations: ['location', 'location.areas', 'responsible', 'responsible.role', 'responsible.area', 'tipoActivo', 'simCards', 'area'] });
        return entity ? ActivoMapper.toDomain(entity) : null;
    }
}
