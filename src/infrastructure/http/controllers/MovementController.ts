import { Request, Response } from "express";
import { RegisterMovement } from "../../../application/use-cases/movement/RegisterMovement";
import { DispatchMovement } from "../../../application/use-cases/movement/DispatchMovement";
import { ReceiveMovement } from "../../../application/use-cases/movement/ReceiveMovement";
import { GetMovements } from "../../../application/use-cases/movement/GetMovements";


export class MovementController {
    constructor(
        private registerMovement: RegisterMovement,
        private dispatchMovement: DispatchMovement,
        private receiveMovement: ReceiveMovement,
        private getMovements: GetMovements
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
     *     summary: Marcar un traslado como "En Tránsito" (Despacho)
     *     tags: [Logística]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string, format: uuid }
     *     responses:
     *       200:
     *         description: Traslado en tránsito
     */
    async dispatch(req: Request, res: Response) {
        try {
            const result = await this.dispatchMovement.execute(req.params.id as string, req.body.evidenceUrl as string);
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
     *     responses:
     *       200:
     *         description: Equipos recibidos y ubicaciones actualizadas
     */
    async receive(req: Request, res: Response) {
        try {
            const result = await this.receiveMovement.execute(req.params.id as string, req.body.receiverId, req.body.receiverEvidenceUrl);
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
}
