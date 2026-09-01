import { Repository } from "typeorm";
import { INotificationRecipientRepository } from "../../../../domain/repositories/INotificationRecipientRepository";
import { NotificationRecipient } from "../../../../domain/entities/NotificationRecipient";
import { NotificationRecipientEntity } from "../entities/NotificationRecipientEntity";
import { NotificationRecipientMapper } from "../../mappers/NotificationRecipientMapper";

export class TypeORMNotificationRecipientRepository implements INotificationRecipientRepository {
    constructor(private readonly repository: Repository<NotificationRecipientEntity>) {}

    async create(recipient: NotificationRecipient): Promise<NotificationRecipient> {
        const entity = NotificationRecipientMapper.toPersistence(recipient);
        const saved = await this.repository.save(entity);
        return NotificationRecipientMapper.toDomain(saved);
    }

    async update(recipient: NotificationRecipient): Promise<NotificationRecipient> {
        const entity = NotificationRecipientMapper.toPersistence(recipient);
        const saved = await this.repository.save(entity);
        return NotificationRecipientMapper.toDomain(saved);
    }

    async findById(id: string): Promise<NotificationRecipient | null> {
        const entity = await this.repository.findOne({ where: { id } });
        return entity ? NotificationRecipientMapper.toDomain(entity) : null;
    }

    async findByEmail(email: string): Promise<NotificationRecipient | null> {
        const entity = await this.repository.findOne({ where: { email: email.trim().toLowerCase() } });
        return entity ? NotificationRecipientMapper.toDomain(entity) : null;
    }

    async findAll(): Promise<NotificationRecipient[]> {
        const entities = await this.repository.find({
            order: {
                createdAt: "DESC"
            }
        });
        return entities.map(e => NotificationRecipientMapper.toDomain(e));
    }

    async findActive(): Promise<NotificationRecipient[]> {
        const entities = await this.repository.find({
            where: { isActive: true },
            order: {
                nombre: "ASC"
            }
        });
        return entities.map(e => NotificationRecipientMapper.toDomain(e));
    }

    async findActiveByEvent(evento: string): Promise<NotificationRecipient[]> {
        const active = await this.findActive();
        return active.filter(recipient => recipient.isSubscribedTo(evento));
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
