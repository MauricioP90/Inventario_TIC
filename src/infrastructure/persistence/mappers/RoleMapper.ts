import { Role, EstadoRole } from "../../../domain/entities/Role";
import { RoleEntity } from "../typeorm/entities/RoleEntity";


export class RoleMapper {
    public static toDomain(entity: RoleEntity): Role {
        return new Role({
            id: entity.id,
            nombre: entity.nombre,
            estado: entity.estado as EstadoRole,
        });
    }

    public static toPersistence(domain: Role): RoleEntity {
        const entity = new RoleEntity();
        entity.id = domain.id!;
        entity.nombre = domain.nombre;
        entity.estado = domain.estado;
        return entity;
    }
}
