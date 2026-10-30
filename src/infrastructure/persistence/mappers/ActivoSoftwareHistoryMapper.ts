import { ActivoSoftwareHistory } from "../../../domain/entities/ActivoSoftwareHistory";
import { ActivoSoftwareHistoryEntity } from "../typeorm/entities/ActivoSoftwareHistoryEntity";

export class ActivoSoftwareHistoryMapper {
    static toDomain(entity: ActivoSoftwareHistoryEntity): ActivoSoftwareHistory {
        return new ActivoSoftwareHistory({
            id: entity.id,
            activoId: entity.activoId,
            softwareVersionId: entity.softwareVersionId,
            licencia: entity.licencia,
            estado: entity.estado as 'INSTALADO' | 'ACTUALIZADO' | 'RETIRADO',
            fechaInstalacion: entity.fechaInstalacion,
            fechaRetiro: entity.fechaRetiro,
            instaladoPor: entity.instaladoPor,
            retiradoPor: entity.retiradoPor,
            observaciones: entity.observaciones,
            createdAt: entity.createdAt
        });
    }

    static toPersistence(domain: ActivoSoftwareHistory): ActivoSoftwareHistoryEntity {
        const entity = new ActivoSoftwareHistoryEntity();
        entity.id = domain.id;
        entity.activoId = domain.activoId;
        entity.softwareVersionId = domain.softwareVersionId;
        entity.licencia = domain.licencia;
        entity.estado = domain.estado;
        entity.fechaInstalacion = domain.fechaInstalacion;
        entity.fechaRetiro = domain.fechaRetiro;
        entity.instaladoPor = domain.instaladoPor;
        entity.retiradoPor = domain.retiradoPor;
        entity.observaciones = domain.observaciones;
        entity.createdAt = domain.createdAt;
        return entity;
    }
}
