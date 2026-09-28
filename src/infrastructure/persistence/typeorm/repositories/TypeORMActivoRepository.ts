import { Repository } from "typeorm";
import { Activo } from "../../../../domain/entities/Activo";
import { IActivoRepository } from "../../../../domain/repositories/IActivoRepository";
import { SearchActivosQuery, SearchActivosResult } from "../../../../domain/repositories/SearchActivosQuery";
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
        const entity = await this.repository.findOne({ where: { placa }, relations: ['location', 'location.areas', 'responsible', 'responsible.area', 'tipoActivo', 'simCards', 'area'] });
        return entity ? ActivoMapper.toDomain(entity) : null;
    }
    async findAll(): Promise<Activo[]> {
        const entities = await this.repository.find({ relations: ['location', 'location.areas', 'responsible', 'responsible.area', 'tipoActivo', 'simCards', 'area'] });
        return entities.map(ActivoMapper.toDomain)
    }

    async search(query: SearchActivosQuery): Promise<SearchActivosResult> {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
        const skip = (page - 1) * limit;

        const qb = this.repository.createQueryBuilder('activo')
            .leftJoinAndSelect('activo.location', 'location')
            .leftJoinAndSelect('location.areas', 'locationAreas')
            .leftJoinAndSelect('activo.responsible', 'responsible')
            .leftJoinAndSelect('responsible.area', 'responsibleArea')
            .leftJoinAndSelect('responsible.cargo', 'responsibleCargo')
            .leftJoinAndSelect('activo.tipoActivo', 'tipoActivo')
            .leftJoinAndSelect('activo.simCards', 'simCards')
            .leftJoinAndSelect('activo.area', 'area');

        if (query.search && query.search.trim()) {
            const term = `%${query.search.trim()}%`;
            qb.andWhere(
                '(activo.placa ILIKE :term OR activo.serial ILIKE :term OR activo.marca ILIKE :term OR activo.modelo ILIKE :term)',
                { term }
            );
        }

        if (query.tipoActivoId) {
            qb.andWhere('activo.tipoActivoId = :tipoActivoId', { tipoActivoId: query.tipoActivoId });
        }

        if (query.locationId) {
            qb.andWhere('activo.locationId = :locationId', { locationId: query.locationId });
        }

        if (query.responsibleId) {
            qb.andWhere('activo.responsibleId = :responsibleId', { responsibleId: query.responsibleId });
        }

        if (query.estado) {
            qb.andWhere('activo.estado = :estado', { estado: query.estado });
        }

        qb.orderBy('activo.fechaIngreso', 'DESC')
          .addOrderBy('activo.placa', 'ASC');

        qb.skip(skip).take(limit);

        const [entities, total] = await qb.getManyAndCount();

        return {
            data: entities.map(ActivoMapper.toDomain),
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit))
        };
    }

    async findBySerial(serial: string): Promise<Activo | null> {
        const entity = await this.repository.findOne({ where: { serial }, relations: ['location', 'location.areas', 'responsible', 'responsible.area', 'tipoActivo', 'simCards', 'area'] });
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
        const entity = await this.repository.findOne({ where: { id }, relations: ['location', 'location.areas', 'responsible', 'responsible.area', 'tipoActivo', 'simCards', 'area'] });
        return entity ? ActivoMapper.toDomain(entity) : null;
    }
}
