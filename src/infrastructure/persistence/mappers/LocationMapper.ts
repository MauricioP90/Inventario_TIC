import { Location, EstadoLocation, TipoLocation } from "../../../domain/entities/Location";
import { LocationEntity } from "../typeorm/entities/LocationEntity";

export class LocationMapper {
    public static toDomain(entity: LocationEntity): Location {
        return new Location({
            id: entity.id,
            code: entity.code,
            nombre: entity.nombre,
            coordenadas: entity.coordenadas,
            tipo: entity.tipo as TipoLocation,
            estado: entity.estado as EstadoLocation,
            responsibleIds: entity.responsibles?.map(resp => resp.id)
        });
    }

    public static toPersistence(domain: Location): LocationEntity {
        const entity = new LocationEntity();
        entity.id = domain.id!;
        entity.code = domain.code;
        entity.nombre = domain.nombre;
        entity.coordenadas = domain.coordenadas || undefined;
        entity.tipo = domain.tipo;
        entity.estado = domain.estado;
        // La relación Many-to-Many se gestiona en el repositorio mediante los IDs
        return entity;
    }
}
