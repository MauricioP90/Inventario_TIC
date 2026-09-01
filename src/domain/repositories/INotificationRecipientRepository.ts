import { NotificationRecipient } from "../entities/NotificationRecipient";

export interface INotificationRecipientRepository {
    create(recipient: NotificationRecipient): Promise<NotificationRecipient>;
    update(recipient: NotificationRecipient): Promise<NotificationRecipient>;
    findById(id: string): Promise<NotificationRecipient | null>;
    findByEmail(email: string): Promise<NotificationRecipient | null>;
    findAll(): Promise<NotificationRecipient[]>;
    findActive(): Promise<NotificationRecipient[]>;
    findActiveByEvent(evento: string): Promise<NotificationRecipient[]>;
    delete(id: string): Promise<void>;
}
