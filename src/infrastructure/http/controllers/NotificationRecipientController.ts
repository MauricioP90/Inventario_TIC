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

    /**
     * @swagger
     * /api/notification-recipients:
     *   get:
     *     summary: Listar destinatarios de notificaciones automáticas
     *     tags: [Notificaciones]
     *     parameters:
     *       - in: query
     *         name: active
     *         schema:
     *           type: boolean
     *         description: Si es true, retorna únicamente destinatarios activos
     *     responses:
     *       200:
     *         description: Lista de destinatarios
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/NotificationRecipient'
     *       500:
     *         description: Error interno del servidor
     */
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

    /**
     * @swagger
     * /api/notification-recipients:
     *   post:
     *     summary: Crear un nuevo destinatario de notificaciones
     *     tags: [Notificaciones]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - email
     *               - nombre
     *               - tipoCopia
     *               - eventos
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *                 example: contabilidad@flotalamacarena.com
     *               nombre:
     *                 type: string
     *                 example: Buzón Contabilidad
     *               area:
     *                 type: string
     *                 example: Contabilidad
     *               tipoCopia:
     *                 type: string
     *                 enum: ['CC', 'BCC']
     *                 default: 'CC'
     *               isActive:
     *                 type: boolean
     *                 default: true
     *               eventos:
     *                 type: array
     *                 items:
     *                   type: string
     *                 example: ['DESPACHO_TRASLADO', 'RECEPCION_TRASLADO', 'BAJA_ACTIVO', 'HURTO_PERDIDA']
     *     responses:
     *       201:
     *         description: Destinatario creado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/NotificationRecipient'
     *       400:
     *         description: Datos inválidos
     */
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

    /**
     * @swagger
     * /api/notification-recipients/{id}:
     *   put:
     *     summary: Actualizar un destinatario de notificaciones
     *     tags: [Notificaciones]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *                 format: email
     *               nombre:
     *                 type: string
     *               area:
     *                 type: string
     *               tipoCopia:
     *                 type: string
     *                 enum: ['CC', 'BCC']
     *               isActive:
     *                 type: boolean
     *               eventos:
     *                 type: array
     *                 items:
     *                   type: string
     *     responses:
     *       200:
     *         description: Destinatario actualizado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/NotificationRecipient'
     *       400:
     *         description: Error en los datos o destinatario no encontrado
     */
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

    /**
     * @swagger
     * /api/notification-recipients/{id}:
     *   delete:
     *     summary: Eliminar un destinatario de notificaciones
     *     tags: [Notificaciones]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       204:
     *         description: Destinatario eliminado exitosamente
     *       400:
     *         description: Error al eliminar
     */
    async delete(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            await this.deleteRecipientUC.execute(id);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({ error: error.message || "Error al eliminar destinatario de notificación" });
        }
    }

    /**
     * @swagger
     * /api/notification-recipients/{id}/toggle-status:
     *   patch:
     *     summary: Alternar estado activo/inactivo de un destinatario
     *     tags: [Notificaciones]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Estado alternado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/NotificationRecipient'
     *       400:
     *         description: Error al cambiar estado
     */
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
