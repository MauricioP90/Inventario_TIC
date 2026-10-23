import { Request, Response } from "express";
import { RegisterMovement } from "../../../application/use-cases/movement/RegisterMovement";
import { DispatchMovement } from "../../../application/use-cases/movement/DispatchMovement";
import { ReceiveMovement } from "../../../application/use-cases/movement/ReceiveMovement";
import { GetMovements } from "../../../application/use-cases/movement/GetMovements";
import { RejectMovement } from "../../../application/use-cases/movement/RejectMovement";


import { ReceiveByMagicLink } from "../../../application/use-cases/movement/ReceiveByMagicLink";
import { GetMovementByMagicLink } from "../../../application/use-cases/movement/GetMovementByMagicLink";
import { RejectByMagicLink } from "../../../application/use-cases/movement/RejectByMagicLink";
import { UpdateMovementNotes } from "../../../application/use-cases/movement/UpdateMovementNotes";
import { CancelMovement } from "../../../application/use-cases/movement/CancelMovement";
import { AttachMovementDocument } from "../../../application/use-cases/movement/AttachMovementDocument";

export class MovementController {
    constructor(
        private registerMovement: RegisterMovement,
        private dispatchMovement: DispatchMovement,
        private receiveMovement: ReceiveMovement,
        private getMovements: GetMovements,
        private rejectMovement: RejectMovement,
        private receiveByMagicLink: ReceiveByMagicLink,
        private getMovementByMagicLink: GetMovementByMagicLink,
        private rejectByMagicLink: RejectByMagicLink,
        private updateMovementNotes: UpdateMovementNotes,
        private cancelMovement: CancelMovement,
        private attachMovementDocument: AttachMovementDocument
    ) { }

    /**
     * @swagger
     * /api/movements:
     *   post:
     *     summary: Registrar un nuevo traslado (Ticket de salida)
     *     tags: [Logística]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [type, originLocationId, destinationLocationId, responsibleId, activoIds]
     *             properties:
     *               type: { type: string, example: "TRASLADO" }
     *               originLocationId: { type: string, format: uuid }
     *               destinationLocationId: { type: string, format: uuid }
     *               responsibleId: { type: string, format: uuid }
     *               activoIds: { type: array, items: { type: string, format: uuid } }
     *               notes: { type: string }
     *     responses:
     *       201:
     *         description: Movimiento registrado exitosamente
     */
    async register(req: Request, res: Response) {
        try {
            const result = await this.registerMovement.execute(req.body);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/movements/{id}/dispatch:
     *   patch:
     *     summary: Marcar un traslado como "En Tránsito" (Despacho físico formal)
     *     tags: [Logística]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string, format: uuid }
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               evidenceUrl: { type: string, description: "URL de la guía de transporte en S3/MinIO" }
     *               documentUrl: { type: string, description: "URL del formato oficial o acta firmada" }
     *               recipients: { type: array, items: { type: string, format: email }, description: "Lista de correos para notificación" }
     *               notifyWhatsApp: { type: boolean, default: true, description: "Enviar plantilla interactiva por WhatsApp vía Wasapi" }
     *     responses:
     *       200:
     *         description: Traslado en tránsito y notificaciones despachadas
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/Movement' }
     */
    async dispatch(req: Request, res: Response) {
        try {
            const notifyWhatsApp = req.body.notifyWhatsApp !== undefined ? Boolean(req.body.notifyWhatsApp) : true;
            const result = await this.dispatchMovement.execute(
                req.params.id as string,
                req.body.evidenceUrl as string | undefined,
                req.body.documentUrl as string | undefined,
                req.body.recipients as string[] | undefined,
                notifyWhatsApp
            );
            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/movements/{id}/receive:
     *   patch:
     *     summary: Confirmar recepción de equipos en destino
     *     tags: [Logística]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string, format: uuid }
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               receiverId: { type: string, format: uuid, description: "ID del responsable que recibe físicamente" }
     *               destinationLocationId: { type: string, format: uuid, description: "Sede física confirmada de recepción" }
     *               receiverEvidenceUrl: { type: string, description: "URL del soporte o foto de recepción" }
     *     responses:
     *       200:
     *         description: Equipos recibidos y ubicaciones actualizadas atómicamente
     *         content:
     *           application/json:
     *             schema: { $ref: '#/components/schemas/Movement' }
     */
    async receive(req: Request, res: Response) {
        try {
            const result = await this.receiveMovement.execute(req.params.id as string, req.body.receiverId, req.body.receiverEvidenceUrl, req.body.destinationLocationId);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/movements:
     *   get:
     *     summary: Consultar historial de movimientos
     *     tags: [Logística]
     *     parameters:
     *       - in: query
     *         name: activoId
     *         schema: { type: string, format: uuid }
     *       - in: query
     *         name: locationId
     *         schema: { type: string, format: uuid }
     *     responses:
     *       200:
     *         description: Lista de movimientos
     */
    async getAll(req: Request, res: Response) {
        try {
            const filters = {
                activoId: req.query.activoId as string | undefined,
                locationId: req.query.locationId as string | undefined
            };
            const result = await this.getMovements.execute(filters);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/movements/{id}/reject:
     *   patch:
     *     summary: Rechazar un traslado en destino por novedades o inconsistencias
     *     tags: [Logística]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string, format: uuid }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [rejectionReason]
     *             properties:
     *               rejectionReason: { type: string, example: "Equipo presenta averías al recibir" }
     *     responses:
     *       200:
     *         description: Traslado rechazado formalmente
     */
    async reject(req: Request, res: Response) {
        try {
            const result = await this.rejectMovement.execute(
                req.params.id as string,
                req.body.rejectionReason as string
            );
            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/movements/public/magic-link/{token}:
     *   get:
     *     summary: Consultar detalle de traslado público mediante token seguro (Magic Link)
     *     tags: [Público / Magic Link]
     *     security: []
     *     parameters:
     *       - in: path
     *         name: token
     *         required: true
     *         schema: { type: string }
     *     responses:
     *       200:
     *         description: Datos del traslado para firma o recepción
     *       404:
     *         description: Enlace no encontrado o vencido
     */
    async getPublicMovement(req: Request, res: Response) {
        try {
            const result = await this.getMovementByMagicLink.execute(req.params.token as string);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(404).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/movements/public/magic-link/{token}/receive:
     *   post:
     *     summary: Confirmar recepción en sitio desde enlace público con evidencia opcional
     *     tags: [Público / Magic Link]
     *     security: []
     *     parameters:
     *       - in: path
     *         name: token
     *         required: true
     *         schema: { type: string }
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             required: [physicalReceiverName]
     *             properties:
     *               physicalReceiverName: { type: string, example: "Carlos Gómez" }
     *               evidence: { type: string, format: binary, description: "Foto o PDF del acta firmada (máx 5MB)" }
     *     responses:
     *       200:
     *         description: Recepción confirmada exitosamente
     */
    async publicReceive(req: Request, res: Response) {
        try {
            const result = await this.receiveByMagicLink.execute(
                req.params.token as string,
                req.body.physicalReceiverName as string,
                req.body.evidenceFile
            );
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/movements/{id}/documents:
     *   patch:
     *     summary: Adjuntar o actualizar soportes y actas oficiales (auditoría posterior)
     *     tags: [Logística]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string, format: uuid }
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               documentUrl: { type: string, description: "URL del acta o comodato firmado por ambas partes" }
     *               receivedEvidenceUrl: { type: string, description: "URL del soporte fotográfico de entrega" }
     *               notes: { type: string, description: "Observaciones de auditoría" }
     *     responses:
     *       200:
     *         description: Documentos actualizados y traza de auditoría registrada
     */
    async attachDocuments(req: Request, res: Response) {
        try {
            const movementId = req.params.id as string;
            const { documentUrl, receivedEvidenceUrl, notes } = req.body;
            const uploadedBy = (req as any).kauth?.grant?.access_token?.content?.name 
                            || (req as any).kauth?.grant?.access_token?.content?.preferred_username 
                            || req.body.uploadedBy;

            const result = await this.attachMovementDocument.execute({
                movementId,
                documentUrl,
                receivedEvidenceUrl,
                notes,
                uploadedBy
            });
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/movements/public/magic-link/{token}/reject:
     *   post:
     *     summary: Rechazar entrega desde enlace público por novedad
     *     tags: [Público / Magic Link]
     *     security: []
     *     parameters:
     *       - in: path
     *         name: token
     *         required: true
     *         schema: { type: string }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [rejectionReason]
     *             properties:
     *               rejectionReason: { type: string, example: "Caja rota con componentes faltantes" }
     *     responses:
     *       200:
     *         description: Rechazo registrado formalmente
     */
    async publicReject(req: Request, res: Response) {
        try {
            const result = await this.rejectByMagicLink.execute(
                req.params.token as string,
                req.body.rejectionReason as string
            );
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/movements/{id}/notes:
     *   patch:
     *     summary: Actualizar observaciones de un movimiento
     *     tags: [Logística]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string, format: uuid }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [notes]
     *             properties:
     *               notes: { type: string }
     *     responses:
     *       200:
     *         description: Observaciones actualizadas preservando todas las relaciones
     */
    async updateNotes(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const { notes } = req.body;
            const result = await this.updateMovementNotes.execute(id, notes || "");
            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/movements/{id}/cancel:
     *   patch:
     *     summary: Anular un movimiento antes del despacho (estado PENDING)
     *     tags: [Logística]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string, format: uuid }
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [reason]
     *             properties:
     *               reason: { type: string, example: "Error de digitación en sede destino" }
     *     responses:
     *       200:
     *         description: Movimiento cancelado y activos revertidos atómicamente a DISPONIBLE
     */
    async cancel(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const { reason } = req.body;
            const user = (req as any).kauth?.grant?.access_token?.content?.preferred_username 
                      || (req as any).kauth?.grant?.access_token?.content?.name 
                      || req.body.cancelledBy;
            const result = await this.cancelMovement.execute(id, reason, user);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
