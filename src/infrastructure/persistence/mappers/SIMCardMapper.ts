import { SIMCard, EstadoSIM } from '../../../domain/entities/SIMCard';
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
            activo: entity.activo ? {
                id: entity.activo.id,
                placa: entity.activo.placa,
                serial: entity.activo.serial,
                marca: entity.activo.marca
            } : null,
            location: entity.location ? {
                id: entity.location.id,
                nombre: entity.location.nombre
            } : (entity.activo?.location ? {
                id: entity.activo.location.id,
                nombre: entity.activo.location.nombre
            } : null)
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
