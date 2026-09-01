import { Request, Response } from "express";
import { GetNotificationRecipients } from "../../../application/use-cases/notification-recipient/GetNotificationRecipients";
import { CreateNotificationRecipient } from "../../../application/use-cases/notification-recipient/CreateNotificationRecipient";
import { UpdateNotificationRecipient } from "../../../application/use-cases/notification-recipient/UpdateNotificationRecipient";
import { DeleteNotificationRecipient } from "../../../application/use-cases/notification-recipient/DeleteNotificationRecipient";
import { ToggleNotificationRecipientStatus } from "../../../application/use-cases/notification-recipient/ToggleNotificationRecipientStatus";

export class NotificationRecipientController {
    constructor(
        private readonly getRecipientsUC: GetNotificationRecipients,
        private readonly createRecipientUC: CreateNotificationRecipient,
        private readonly updateRecipientUC: UpdateNotificationRecipient,
        private readonly deleteRecipientUC: DeleteNotificationRecipient,
        private readonly toggleStatusUC: ToggleNotificationRecipientStatus
    ) {}

    async getAll(req: Request, res: Response): Promise<void> {
        try {
            const onlyActive = req.query.active === 'true';
            const recipients = await this.getRecipientsUC.execute(onlyActive);
            res.json(recipients.map(r => ({
                id: r.id,
                email: r.email,
                nombre: r.nombre,
                area: r.area,
                tipoCopia: r.tipoCopia,
                isActive: r.isActive,
                eventos: r.eventos,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt
            })));
        } catch (error: any) {
            res.status(500).json({ error: error.message || "Error al obtener destinatarios de notificación" });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const { email, nombre, area, tipoCopia, isActive, eventos } = req.body;
            const recipient = await this.createRecipientUC.execute({
                email,
                nombre,
                area,
                tipoCopia,
                isActive,
                eventos
            });
            res.status(201).json({
                id: recipient.id,
                email: recipient.email,
                nombre: recipient.nombre,
                area: recipient.area,
                tipoCopia: recipient.tipoCopia,
                isActive: recipient.isActive,
                eventos: recipient.eventos,
                createdAt: recipient.createdAt,
                updatedAt: recipient.updatedAt
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message || "Error al crear destinatario de notificación" });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            const { email, nombre, area, tipoCopia, isActive, eventos } = req.body;
            const recipient = await this.updateRecipientUC.execute({
                id,
                email,
                nombre,
                area,
                tipoCopia,
                isActive,
                eventos
            });
            res.json({
                id: recipient.id,
                email: recipient.email,
                nombre: recipient.nombre,
                area: recipient.area,
                tipoCopia: recipient.tipoCopia,
                isActive: recipient.isActive,
                eventos: recipient.eventos,
                createdAt: recipient.createdAt,
                updatedAt: recipient.updatedAt
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message || "Error al actualizar destinatario de notificación" });
        }
    }

    async delete(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            await this.deleteRecipientUC.execute(id);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({ error: error.message || "Error al eliminar destinatario de notificación" });
        }
    }

    async toggleStatus(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            const recipient = await this.toggleStatusUC.execute(id);
            res.json({
                id: recipient.id,
                email: recipient.email,
                nombre: recipient.nombre,
                area: recipient.area,
                tipoCopia: recipient.tipoCopia,
                isActive: recipient.isActive,
                eventos: recipient.eventos,
                createdAt: recipient.createdAt,
                updatedAt: recipient.updatedAt
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message || "Error al cambiar estado del destinatario" });
        }
    }
}
