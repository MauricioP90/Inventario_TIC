import { INotificationRecipientRepository } from "../../../domain/repositories/INotificationRecipientRepository";
import { NotificationRecipient } from "../../../domain/entities/NotificationRecipient";

export interface CreateNotificationRecipientDTO {
    email: string;
    nombre: string;
    area: string;
    tipoCopia?: 'CC' | 'BCC';
    isActive?: boolean;
    eventos?: string[];
}

export class CreateNotificationRecipient {
    constructor(private readonly repository: INotificationRecipientRepository) {}

    async execute(dto: CreateNotificationRecipientDTO): Promise<NotificationRecipient> {
        const existing = await this.repository.findByEmail(dto.email);
        if (existing) {
            throw new Error(`Ya existe un destinatario registrado con el correo ${dto.email}.`);
        }

        const recipient = new NotificationRecipient({
            email: dto.email,
            nombre: dto.nombre,
            area: dto.area,
            tipoCopia: dto.tipoCopia || 'CC',
            isActive: dto.isActive !== undefined ? dto.isActive : true,
            eventos: dto.eventos && dto.eventos.length > 0 ? dto.eventos : ['DESPACHO_TRASLADO', 'RECEPCION_TRASLADO']
        });

        return this.repository.create(recipient);
    }
}
