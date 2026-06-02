import { Movement, MovementStatus } from "../../../domain/entities/Movement";
import { MovementEntity } from "../typeorm/entities/MovementEntity";
import { LocationMapper } from "./LocationMapper";
import { ResponsibleMapper } from "./ResponsibleMapper";
import { ActivoMapper } from "./ActivoMapper";

export class MovementMapper {
    static toDomain(entity: MovementEntity): Movement {
        return new Movement({
            id: entity.id,
            parentMovementId: entity.parentMovementId,
            type: entity.type,
            originLocationId: entity.originLocationId,
            destinationLocationId: entity.destinationLocationId,
            responsibleId: entity.responsibleId,
            receiverId: entity.receiverId,
            status: entity.status as MovementStatus,
            activoIds: entity.activos?.map(a => a.id) || [],
            notes: entity.notes,
            evidenceUrl: entity.evidenceUrl,
            receivedEvidenceUrl: entity.receivedEvidenceUrl,
            createdAt: entity.createdAt,
            shippedAt: entity.shippedAt || undefined,
            receivedAt: entity.receivedAt || undefined,
            originLocation: entity.originLocation ? LocationMapper.toDomain(entity.originLocation) : undefined,
            destinationLocation: entity.destinationLocation ? LocationMapper.toDomain(entity.destinationLocation) : undefined,
            responsible: entity.responsible ? ResponsibleMapper.toDomain(entity.responsible) : undefined,
            receiver: entity.receiver ? ResponsibleMapper.toDomain(entity.receiver) : undefined,
            activos: entity.activos ? entity.activos.map(a => ActivoMapper.toDomain(a)) : []
        });
    }

    static toPersistence(domain: Movement): MovementEntity {
        const entity = new MovementEntity();
        entity.id = domain.id!;
        entity.parentMovementId = domain.parentMovementId;
        entity.type = domain.type;
        entity.originLocationId = domain.originLocationId;
        entity.destinationLocationId = domain.destinationLocationId;
        entity.responsibleId = domain.responsibleId;
        entity.receiverId = domain.receiverId;
        entity.status = domain.status;
        entity.notes = domain.notes;
        entity.evidenceUrl = domain.evidenceUrl;
        entity.receivedEvidenceUrl = domain.receivedEvidenceUrl;
        entity.createdAt = domain.createdAt!;
        entity.shippedAt = domain.shippedAt;
        entity.receivedAt = domain.receivedAt;

        // Nota: Los activos se manejan usualmente en el repositorio
        // debido a que necesitan ser cargados desde la DB
        return entity;
    }
}
