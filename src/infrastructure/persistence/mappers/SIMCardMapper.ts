import { SIMCard, EstadoSIM } from '../../../domain/entities/SIMCard';
import { Activo, EstadoActivo } from '../../../domain/entities/Activo';
import { LocationMapper } from './LocationMapper';
import { ResponsibleMapper } from './ResponsibleMapper';
import { SIMCardEntity } from '../typeorm/entities/SIMCardEntity';

export class SIMCardMapper {
    public static toDomain(entity: SIMCardEntity): SIMCard {
        return new SIMCard({
            id: entity.id,
            iccid: entity.iccid,
            numero: entity.numero,
            operador: entity.operador,
            estado: entity.estado as EstadoSIM,
            activoId: entity.activo?.id,
            locationId: entity.location?.id || entity.activo?.location?.id,
            responsibleId: entity.activo?.responsible?.id || entity.activo?.responsibleId,
            activo: entity.activo ? new Activo({
                id: entity.activo.id,
                placa: entity.activo.placa,
                tipoActivoId: entity.activo.tipoActivoId as string,
                marca: entity.activo.marca,
                modelo: entity.activo.modelo,
                serial: entity.activo.serial,
                estado: entity.activo.estado as EstadoActivo,
                fechaIngreso: entity.activo.fechaIngreso,
                facturaUrl: entity.activo.facturaUrl,
                locationId: entity.activo.locationId,
                responsibleId: entity.activo.responsibleId,
                areaId: entity.activo.areaId,
                location: entity.activo.location ? LocationMapper.toDomain(entity.activo.location) : undefined,
                responsible: entity.activo.responsible ? ResponsibleMapper.toDomain(entity.activo.responsible) : undefined
            }) : null,
            location: entity.location ? LocationMapper.toDomain(entity.location) : (entity.activo?.location ? LocationMapper.toDomain(entity.activo.location) : null),
            responsible: entity.activo?.responsible ? ResponsibleMapper.toDomain(entity.activo.responsible) : null
        });
    }

    public static toPersistence(domain: SIMCard): SIMCardEntity {
        const entity = new SIMCardEntity();
        entity.id = domain.id!;
        entity.numero = domain.numero;
        entity.iccid = domain.iccid;
        entity.operador = domain.operador;
        entity.estado = domain.estado;

        if (domain.activoId) {
            entity.activo = {
                id: domain.activoId
            } as any;
        } else {
            entity.activo = null as any;
        }

        if (domain.locationId) {
            entity.location = {
                id: domain.locationId
            } as any;
        } else {
            entity.location = null as any;
        }

        return entity;
    }
}
