import { NotificationRecipient } from "../../../domain/entities/NotificationRecipient";
import { NotificationRecipientEntity } from "../typeorm/entities/NotificationRecipientEntity";

export class NotificationRecipientMapper {
    static toDomain(entity: NotificationRecipientEntity): NotificationRecipient {
        const rawEventos = Array.isArray(entity.eventos)
            ? entity.eventos
            : (typeof entity.eventos === 'string' ? (entity.eventos as string).split(',').map(e => e.trim()).filter(Boolean) : []);

        return new NotificationRecipient({
            id: entity.id,
            email: entity.email,
            nombre: entity.nombre,
            area: entity.area,
            tipoCopia: entity.tipoCopia,
            isActive: entity.isActive,
            eventos: rawEventos,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt
        });
    }

    static toPersistence(domain: NotificationRecipient): NotificationRecipientEntity {
        const entity = new NotificationRecipientEntity();
        entity.id = domain.id!;
        entity.email = domain.email;
        entity.nombre = domain.nombre;
        entity.area = domain.area;
        entity.tipoCopia = domain.tipoCopia;
        entity.isActive = domain.isActive;
        entity.eventos = domain.eventos;
        entity.createdAt = domain.createdAt || new Date();
        entity.updatedAt = domain.updatedAt || new Date();
        return entity;
    }
}
