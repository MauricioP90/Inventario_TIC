import { SoftwareVersion } from "../../../domain/entities/SoftwareVersion";
import { SoftwareVersionEntity } from "../typeorm/entities/SoftwareVersionEntity";
import { SoftwareVersionVO } from "../../../domain/value-objects/SoftwareVersionVO";

export class SoftwareVersionMapper {
    static toDomain(entity: SoftwareVersionEntity): SoftwareVersion {
        return new SoftwareVersion({
            id: entity.id,
            softwareAppId: entity.softwareAppId,
            version: SoftwareVersionVO.create(entity.version),
            esVigente: entity.esVigente,
            notasLanzamiento: entity.notasLanzamiento,
            fechaLanzamiento: entity.fechaLanzamiento,
            createdAt: entity.createdAt
        });
    }

    static toPersistence(domain: SoftwareVersion): SoftwareVersionEntity {
        const entity = new SoftwareVersionEntity();
        entity.id = domain.id;
        entity.softwareAppId = domain.softwareAppId;
        entity.version = domain.version.getValue();
        entity.esVigente = domain.esVigente;
        entity.notasLanzamiento = domain.notasLanzamiento;
        entity.fechaLanzamiento = domain.fechaLanzamiento;
        entity.createdAt = domain.createdAt;
        return entity;
    }
}
