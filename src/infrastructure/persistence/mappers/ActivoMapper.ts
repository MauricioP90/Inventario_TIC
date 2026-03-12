import { Activo, EstadoActivo } from '../../../domain/entities/Activo';
import { ActivoEntity } from '../typeorm/entities/ActivoEntity';

export class ActivoMapper {
    // Convierte de la base de datos al Dominio
    public static toDomain(entity: ActivoEntity): Activo {
        return new Activo({
            id: entity.id,
            placa: entity.placa,
            tipo: entity.tipo,
            marca: entity.marca,
            modelo: entity.modelo,
            serial: entity.serial,
            estado: entity.estado as EstadoActivo,
            fechaIngreso: entity.fechaIngreso,
            facturaUrl: entity.facturaUrl
        });
    }

    // Convierte del Dominio a la base de datos
    public static toPersistence(domain: Activo): ActivoEntity {
        const entity = new ActivoEntity();
        entity.id = domain.id!;
        entity.placa = domain.placa;
        entity.tipo = domain.tipo;
        entity.marca = domain.marca;
        entity.modelo = domain.modelo;
        entity.serial = domain.serial;
        entity.estado = domain.estado;
        entity.fechaIngreso = domain.fechaIngreso;
        entity.facturaUrl = domain.facturaUrl;
        return entity;
    }
}
