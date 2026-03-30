import { Location, EstadoLocation } from "../../../domain/entities/Location";
import { LocationEntity } from "../typeorm/entities/LocationEntity";

export class LocationMapper {
    public static toDomain(entity: LocationEntity): Location {
        return new Location({
            id: entity.id,
            code: entity.code,
            nombre: entity.nombre,
            coordenadas: entity.coordenadas,
            estado: entity.estado as EstadoLocation,
            responsibleId: entity.responsibleId
        });
    }

    public static toPersistence(domain: Location): LocationEntity {
        const entity = new LocationEntity();
        entity.id = domain.id!;
        entity.code = domain.code;
        entity.nombre = domain.nombre;
        entity.coordenadas = domain.coordenadas || undefined;
        entity.estado = domain.estado;
        entity.responsibleId = domain.responsibleId;
        return entity;
    }
}   
