import { Repository } from "typeorm";
import { Role } from "../../../../domain/entities/Role";
import { IRoleRepository } from "../../../../domain/repositories/IRoleRepository";
import { RoleEntity } from "../entities/RoleEntity";
import { RoleMapper } from "../../mappers/RoleMapper";

export class TypeORMRoleRepository implements IRoleRepository {
    constructor(private readonly repository: Repository<RoleEntity>) { }

    async create(role: Role): Promise<Role> {
        const entity = RoleMapper.toPersistence(role);
        await this.repository.save(entity);
        return RoleMapper.toDomain(entity);
    }
    async update(role: Role): Promise<Role> {
        const entity = RoleMapper.toPersistence(role);
        await this.repository.save(entity);
        return RoleMapper.toDomain(entity);
    }
    async activate(id: string): Promise<Role> {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) throw new Error('Rol no encontrado');
        entity.estado = 'ACTIVO';
        await this.repository.save(entity);
        return RoleMapper.toDomain(entity);
    }
    async inactivate(id: string): Promise<Role> {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) throw new Error('Rol no encontrado');
        entity.estado = 'INACTIVO';
        await this.repository.save(entity);
        return RoleMapper.toDomain(entity);
    }
    async findById(id: string): Promise<Role | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? RoleMapper.toDomain(entity) : null;
    }
    async findAll(): Promise<Role[]> {
        const entities = await this.repository.find();
        return entities.map(entity => RoleMapper.toDomain(entity));
    }
}