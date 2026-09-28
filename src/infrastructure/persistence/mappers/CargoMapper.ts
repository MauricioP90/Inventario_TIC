import { Cargo, EstadoCargo } from "../../../domain/entities/Cargo";
import { CargoEntity } from "../typeorm/entities/CargoEntity";

export class CargoMapper {
    public static toDomain(entity: CargoEntity): Cargo {
        return new Cargo({
            id: entity.id,
            nombre: entity.nombre,
            estado: entity.estado as EstadoCargo,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        });
    }

    public static toPersistence(domain: Cargo): CargoEntity {
        const entity = new CargoEntity();
        entity.id = domain.id!;
        entity.nombre = domain.nombre;
        entity.estado = domain.estado;
        return entity;
    }
}
