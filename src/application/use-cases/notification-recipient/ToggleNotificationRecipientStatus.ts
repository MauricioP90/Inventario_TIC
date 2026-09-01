import { INotificationRecipientRepository } from "../../../domain/repositories/INotificationRecipientRepository";
import { NotificationRecipient } from "../../../domain/entities/NotificationRecipient";

export class ToggleNotificationRecipientStatus {
    constructor(private readonly repository: INotificationRecipientRepository) {}

    async execute(id: string): Promise<NotificationRecipient> {
        const recipient = await this.repository.findById(id);
        if (!recipient) {
            throw new Error(`Destinatario no encontrado con ID ${id}.`);
        }

        recipient.toggleActive();
        return this.repository.update(recipient);
    }
}
