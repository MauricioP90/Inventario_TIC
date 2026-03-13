import { Location, EstadoLocation } from "../../../domain/entities/Location";
import { LocationEntity } from "../typeorm/entities/LocationEntity";

export class LocationMapper {
    public static toDomain(entity: LocationEntity): Location {
        return new Location({
            id: entity.id,
            nombre: entity.nombre,
            direccion: entity.direccion,
            estado: entity.estado as EstadoLocation,
            responsableId: entity.responsableId
        });
    }

    public static toPersistence(domain: Location): LocationEntity {
        const entity = new LocationEntity();
        entity.id = domain.id!;
        entity.nombre = domain.nombre;
        entity.direccion = domain.direccion;
        entity.estado = domain.estado;
        entity.responsableId = domain.responsableId;
        return entity;
    }
}   
