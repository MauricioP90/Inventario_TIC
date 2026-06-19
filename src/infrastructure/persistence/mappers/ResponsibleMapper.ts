import { Responsible, EstadoResponsable } from "../../../domain/entities/Responsible";
import { ResponsibleEntity } from "../typeorm/entities/ResponsibleEntity";
import { RoleMapper } from "./RoleMapper";
import { AreaMapper } from "./AreaMapper";

export class ResponsibleMapper {
    public static toDomain(entity: ResponsibleEntity): Responsible {
        return new Responsible({
            id: entity.id,
            nombre: entity.nombre,
            email: entity.email,
            telefono: entity.telefono,
            estado: entity.estado as EstadoResponsable,
            role: entity.role ? RoleMapper.toDomain(entity.role) : undefined,
            area: entity.area ? AreaMapper.toDomain(entity.area) : undefined,
            locationIds: entity.locations?.map(loc => loc.id),
            totalActivos: entity.activosCount,
            totalSIMCards: entity.simCardsCount
        });
    }

    public static toPersistence(domain: Responsible): ResponsibleEntity {
        const entity = new ResponsibleEntity();
        entity.id = domain.id!;
        entity.nombre = domain.nombre;
        entity.email = domain.email;
        entity.telefono = domain.telefono;
        entity.estado = domain.estado;
        entity.role = domain.role ? RoleMapper.toPersistence(domain.role) : undefined;
        entity.area = domain.area ? AreaMapper.toPersistence(domain.area) : undefined;
        return entity;
    }
}   