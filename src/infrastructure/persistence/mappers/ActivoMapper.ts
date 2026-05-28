import { Activo, EstadoActivo } from '../../../domain/entities/Activo';
import { ActivoEntity } from '../typeorm/entities/ActivoEntity';
import { LocationMapper } from './LocationMapper';
import { ResponsibleMapper } from './ResponsibleMapper';
import { TipoActivoMapper } from './TipoActivoMapper';
import { SIMCardMapper } from './SIMCardMapper';

export class ActivoMapper {
    // Convierte de la base de datos al Dominio
    public static toDomain(entity: ActivoEntity): Activo {
        const domain = new Activo({
            id: entity.id,
            placa: entity.placa,
            tipoActivoId: entity.tipoActivoId as string,
            marca: entity.marca,
            modelo: entity.modelo,
            serial: entity.serial,
            estado: entity.estado as EstadoActivo,
            fechaIngreso: entity.fechaIngreso,
            facturaUrl: entity.facturaUrl,
            locationId: entity.locationId,
            responsibleId: entity.responsibleId,
            location: entity.location ? LocationMapper.toDomain(entity.location) : undefined,
            responsable: entity.responsible ? ResponsibleMapper.toDomain(entity.responsible) : undefined,
            tipoActivo: entity.tipoActivo ? TipoActivoMapper.toDomain(entity.tipoActivo) : undefined
        });

        if (entity.simCards) {
            entity.simCards.forEach(sim => {
                domain.asignarSIMCard(SIMCardMapper.toDomain(sim));
            });
        }

        return domain;
    }

    // Convierte del Dominio a la base de datos
    public static toPersistence(domain: Activo): ActivoEntity {
        const entity = new ActivoEntity();
        entity.id = domain.id!;
        entity.placa = domain.placa;
        entity.tipoActivoId = domain.tipoActivoId;
        entity.marca = domain.marca;
        entity.modelo = domain.modelo;
        entity.serial = domain.serial;
        entity.estado = domain.estado;
        entity.fechaIngreso = domain.fechaIngreso;
        entity.facturaUrl = domain.facturaUrl;
        entity.locationId = domain.locationId;
        entity.responsibleId = domain.responsibleId;
        return entity;
    }
}
