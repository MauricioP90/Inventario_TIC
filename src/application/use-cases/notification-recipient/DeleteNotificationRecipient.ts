import { INotificationRecipientRepository } from "../../../domain/repositories/INotificationRecipientRepository";

export class DeleteNotificationRecipient {
    constructor(private readonly repository: INotificationRecipientRepository) {}

    async execute(id: string): Promise<void> {
        const recipient = await this.repository.findById(id);
        if (!recipient) {
            throw new Error(`Destinatario no encontrado con ID ${id}.`);
        }
        await this.repository.delete(id);
    }
}
