import { ModeloActivo, EstadoModeloActivo } from "../../../domain/entities/ModeloActivo";
import { ModeloActivoEntity } from "../typeorm/entities/ModeloActivoEntity";

export class ModeloActivoMapper {
    public static toDomain(entity: ModeloActivoEntity): ModeloActivo {
        return new ModeloActivo({
            id: entity.id,
            tipoActivoId: entity.tipoActivoId,
            marca: entity.marca,
            modelo: entity.modelo,
            estado: entity.estado as EstadoModeloActivo,
            createdAt: entity.createdAt
        });
    }

    public static toPersistence(domain: ModeloActivo): ModeloActivoEntity {
        const entity = new ModeloActivoEntity();
        entity.id = domain.id;
        entity.tipoActivoId = domain.tipoActivoId;
        entity.marca = domain.marca;
        entity.modelo = domain.modelo;
        entity.estado = domain.estado;
        entity.createdAt = domain.createdAt;
        return entity;
    }
}
