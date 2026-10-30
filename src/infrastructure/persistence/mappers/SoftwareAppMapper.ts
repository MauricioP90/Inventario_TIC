import { SoftwareApp } from "../../../domain/entities/SoftwareApp";
import { SoftwareAppEntity } from "../typeorm/entities/SoftwareAppEntity";

export class SoftwareAppMapper {
    static toDomain(entity: SoftwareAppEntity): SoftwareApp {
        return new SoftwareApp({
            id: entity.id,
            nombre: entity.nombre,
            descripcion: entity.descripcion,
            estado: entity.estado as 'ACTIVO' | 'INACTIVO',
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt
        });
    }

    static toPersistence(domain: SoftwareApp): SoftwareAppEntity {
        const entity = new SoftwareAppEntity();
        entity.id = domain.id;
        entity.nombre = domain.nombre;
        entity.descripcion = domain.descripcion;
        entity.estado = domain.estado;
        entity.createdAt = domain.createdAt;
        entity.updatedAt = domain.updatedAt;
        return entity;
    }
}
