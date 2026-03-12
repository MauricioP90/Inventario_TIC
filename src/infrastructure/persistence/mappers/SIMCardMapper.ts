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
            activoId: entity.activo?.id
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
        }

        return entity;
    }
}
