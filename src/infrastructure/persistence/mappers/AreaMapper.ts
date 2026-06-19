import { Area, EstadoArea } from "../../../domain/entities/Area";
import { AreaEntity } from "../typeorm/entities/AreaEntity";

export class AreaMapper {
    public static toDomain(entity: AreaEntity): Area {
        return new Area({
            id: entity.id,
            code: entity.code,
            nombre: entity.nombre,
            estado: entity.estado as EstadoArea,
        });
    }

    public static toPersistence(domain: Area): AreaEntity {
        const entity = new AreaEntity();
        entity.id = domain.id!;
        entity.code = domain.code;
        entity.nombre = domain.nombre;
        entity.estado = domain.estado;
        return entity;
    }
}
