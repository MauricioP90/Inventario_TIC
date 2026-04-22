import { TipoActivo } from "../../../domain/entities/TipoActivo";
import { TipoActivoEntity } from "../typeorm/entities/TipoActivoEntity";
import { EstadoTipoActivo } from "../../../domain/entities/TipoActivo";

export class TipoActivoMapper {
    public static toDomain(entity: TipoActivoEntity): TipoActivo {
        return new TipoActivo({
            id: entity.id,
            nombre: entity.nombre,
            estado: entity.estado as EstadoTipoActivo
        });
    }

    public static toPersistence(domain: TipoActivo): TipoActivoEntity {
        const entity = new TipoActivoEntity();
        entity.id = domain.id!;
        entity.nombre = domain.nombre;
        entity.estado = domain.estado;
        return entity;
    }
}