import { Responsible, EstadoResponsable } from "../../../domain/entities/Responsible";
import { ResponsibleEntity } from "../typeorm/entities/ResponsibleEntity";

export class ResponsibleMapper {
    public static toDomain(entity: ResponsibleEntity): Responsible {
        return new Responsible({
            id: entity.id,
            nombre: entity.nombre,
            email: entity.email,
            telefono: entity.telefono,
            estado: entity.estado as EstadoResponsable
        });
    }

    public static toPersistence(domain: Responsible): ResponsibleEntity {
        const entity = new ResponsibleEntity();
        entity.id = domain.id!;
        entity.nombre = domain.nombre;
        entity.email = domain.email;
        entity.telefono = domain.telefono;
        entity.estado = domain.estado;
        return entity;
    }
}   