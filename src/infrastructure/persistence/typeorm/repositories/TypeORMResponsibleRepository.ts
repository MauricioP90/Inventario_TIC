import { DataSource, Repository } from "typeorm";
import { Responsible } from "../../../../domain/entities/Responsible";
import { IResponsibleRepository } from "../../../../domain/repositories/IResponsibleRepository";
import { ResponsibleEntity } from "../entities/ResponsibleEntity";
import { ResponsibleMapper } from "../../mappers/ResponsibleMapper";

export class TypeORMResponsibleRepository implements IResponsibleRepository {
    constructor(private readonly repository: Repository<ResponsibleEntity>) { }

    async create(responsible: Responsible): Promise<Responsible> {
        const entity = ResponsibleMapper.toPersistence(responsible);
        const savedEntity = await this.repository.save(entity);
        return ResponsibleMapper.toDomain(savedEntity);
    }

    async update(responsible: Responsible): Promise<Responsible> {
        const entity = ResponsibleMapper.toPersistence(responsible);
        const updatedEntity = await this.repository.save(entity);
        return ResponsibleMapper.toDomain(updatedEntity);
    }

    async findById(id: string): Promise<Responsible | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? ResponsibleMapper.toDomain(entity) : null;
    }

    async findAll(): Promise<Responsible[]> {
        const entities = await this.repository.find();
        return entities.map(entity => ResponsibleMapper.toDomain(entity));
    }
}