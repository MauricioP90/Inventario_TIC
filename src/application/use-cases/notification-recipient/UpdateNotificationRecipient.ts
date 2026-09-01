import { INotificationRecipientRepository } from "../../../domain/repositories/INotificationRecipientRepository";
import { NotificationRecipient } from "../../../domain/entities/NotificationRecipient";

export interface UpdateNotificationRecipientDTO {
    id: string;
    email?: string;
    nombre?: string;
    area?: string;
    tipoCopia?: 'CC' | 'BCC';
    isActive?: boolean;
    eventos?: string[];
}

export class UpdateNotificationRecipient {
    constructor(private readonly repository: INotificationRecipientRepository) {}

    async execute(dto: UpdateNotificationRecipientDTO): Promise<NotificationRecipient> {
        const recipient = await this.repository.findById(dto.id);
        if (!recipient) {
            throw new Error(`Destinatario de notificación no encontrado con ID ${dto.id}.`);
        }

        if (dto.email && dto.email.trim().toLowerCase() !== recipient.email) {
            const existing = await this.repository.findByEmail(dto.email);
            if (existing && existing.id !== recipient.id) {
                throw new Error(`Ya existe otro destinatario registrado con el correo ${dto.email}.`);
            }
        }

        recipient.update({
            email: dto.email,
            nombre: dto.nombre,
            area: dto.area,
            tipoCopia: dto.tipoCopia,
            isActive: dto.isActive,
            eventos: dto.eventos
        });

        return this.repository.update(recipient);
    }
}
