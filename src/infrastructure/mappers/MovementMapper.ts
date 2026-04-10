import { Movement, MovementStatus } from "../../domain/entities/Movement";
import { MovementEntity } from "../persistence/typeorm/entities/MovementEntity";

export class MovementMapper {
    static toDomain(entity: MovementEntity): Movement {
        return new Movement({
            id: entity.id,
            type: entity.type,
            originLocationId: entity.originLocationId,
            destinationLocationId: entity.destinationLocationId,
            responsibleId: entity.responsibleId,
            status: entity.status as MovementStatus,
            activoIds: entity.activos?.map(a => a.id) || [],
            notes: entity.notes,
            evidenceUrl: entity.evidenceUrl,
            createdAt: entity.createdAt,
            shippedAt: entity.shippedAt || undefined,
            receivedAt: entity.receivedAt || undefined
        });
    }

    static toPersistence(domain: Movement): MovementEntity {
        const entity = new MovementEntity();
        entity.id = domain.id!;
        entity.type = domain.type;
        entity.originLocationId = domain.originLocationId;
        entity.destinationLocationId = domain.destinationLocationId;
        entity.responsibleId = domain.responsibleId;
        entity.status = domain.status;
        entity.notes = domain.notes;
        entity.evidenceUrl = domain.evidenceUrl;
        entity.createdAt = domain.createdAt!;
        entity.shippedAt = domain.shippedAt;
        entity.receivedAt = domain.receivedAt;
        
        // Nota: Los activos se manejan usualmente en el repositorio
        // debido a que necesitan ser cargados desde la DB
        return entity;
    }
}
