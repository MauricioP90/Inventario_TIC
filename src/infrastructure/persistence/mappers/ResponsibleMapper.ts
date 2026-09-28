import { Responsible, EstadoResponsable } from "../../../domain/entities/Responsible";
import { ResponsibleEntity } from "../typeorm/entities/ResponsibleEntity";
import { AreaMapper } from "./AreaMapper";
import { CargoMapper } from "./CargoMapper";

export class ResponsibleMapper {
    public static toDomain(entity: ResponsibleEntity): Responsible {
        return new Responsible({
            id: entity.id,
            nombre: entity.nombre,
            email: entity.email,
            telefono: entity.telefono,
            estado: entity.estado as EstadoResponsable,
            area: entity.area ? AreaMapper.toDomain(entity.area) : undefined,
            cargo: entity.cargo ? CargoMapper.toDomain(entity.cargo) : undefined,
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
        entity.area = domain.area ? AreaMapper.toPersistence(domain.area) : (domain.area === null ? null as any : undefined);
        entity.cargo = domain.cargo ? CargoMapper.toPersistence(domain.cargo) : (domain.cargo === null ? null as any : undefined);
        return entity;
    }
}   