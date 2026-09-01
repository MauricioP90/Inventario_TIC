import { INotificationRecipientRepository } from "../../../domain/repositories/INotificationRecipientRepository";
import { NotificationRecipient } from "../../../domain/entities/NotificationRecipient";

export class GetNotificationRecipients {
    constructor(private readonly repository: INotificationRecipientRepository) {}

    async execute(onlyActive: boolean = false): Promise<NotificationRecipient[]> {
        if (onlyActive) {
            return this.repository.findActive();
        }
        return this.repository.findAll();
    }
}
