import { Request, Response } from "express";
import { CreateMaintenanceReport } from "../../../application/use-cases/maintenance/CreateMaintenanceReport";
import { UpdateMaintenanceReport } from "../../../application/use-cases/maintenance/UpdateMaintenanceReport";
import { GetActiveMaintenance } from "../../../application/use-cases/maintenance/GetActiveMaintenance";
import { GetMaintenanceHistory } from "../../../application/use-cases/maintenance/GetMaintenanceHistory";

export class MaintenanceController {
    constructor(
        private createUC: CreateMaintenanceReport,
        private updateUC: UpdateMaintenanceReport,
        private getActiveUC: GetActiveMaintenance,
        private getHistoryUC: GetMaintenanceHistory
    ) { }

    /**
     * @swagger
     * /api/maintenance:
     *   post:
     *     summary: Abrir una nueva ficha de mantenimiento
     *     tags: [Mantenimientos]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [activoId, modalidad, tipoMantenimiento]
     *             properties:
     *               activoId:
     *                 type: string
     *                 format: uuid
     *               modalidad:
     *                 type: string
     *                 enum: [INTERNO, EXTERNO]
     *               tipoMantenimiento:
     *                 type: string
     *                 enum: [PREVENTIVO, CORRECTIVO]
     *               tecnicoResponsable:
     *                 type: string
     *                 description: Obligatorio si modalidad es INTERNO
     *               proveedorServicio:
     *                 type: string
     *                 description: Obligatorio si modalidad es EXTERNO
     *               costoEstimado:
     *                 type: number
     *     responses:
     *       201:
     *         description: Ficha de mantenimiento creada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/MaintenanceReport'
     */
    async create(req: Request, res: Response) {
        try {
            const report = await this.createUC.execute(req.body);
            res.status(201).json(report.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/maintenance/{id}:
     *   patch:
     *     summary: Actualizar el estado o datos de una ficha de mantenimiento (Iniciar, Escalar, Cerrar, Retorno Proveedor, etc.)
     *     tags: [Mantenimientos]
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
     *             required: [accion]
     *             properties:
     *               accion:
     *                 type: string
     *                 enum: [iniciar, escalar, retorno_proveedor, solicitar_autorizacion, aprobar, cerrar, actualizar]
     *               diagnostico:
     *                 type: string
     *               tecnicoResponsable:
     *                 type: string
     *               proveedorServicio:
     *                 type: string
     *               motivoEscalacion:
     *                 type: string
     *               costoEstimado:
     *                 type: number
     *               costoFinal:
     *                 type: number
     *               accionesRealizadas:
     *                 type: string
     *               repuestosUsados:
     *                 type: string
     *               resultadoFinal:
     *                 type: string
     *                 enum: [REPARADO, IRREPARABLE, SIN_FALLAS]
     *               cubiertoPorGarantia:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Ficha de mantenimiento actualizada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/MaintenanceReport'
     */
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await this.updateUC.execute({ id, ...req.body });
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/maintenance/active:
     *   get:
     *     summary: Listar todas las fichas de mantenimiento activas (no cerradas)
     *     tags: [Mantenimientos]
     *     responses:
     *       200:
     *         description: Lista de fichas activas
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/MaintenanceReport'
     */
    async getActive(req: Request, res: Response) {
        try {
            const reports = await this.getActiveUC.execute();
            res.json(reports);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/maintenance/history:
     *   get:
     *     summary: Obtener el historial de fichas de mantenimiento cerradas, opcionalmente filtrado por activo
     *     tags: [Mantenimientos]
     *     parameters:
     *       - in: query
     *         name: activoId
     *         schema:
     *           type: string
     *           format: uuid
     *         description: ID del activo para filtrar su historial
     *     responses:
     *       200:
     *         description: Historial de mantenimientos
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/MaintenanceReport'
     */
    async getHistory(req: Request, res: Response) {
        try {
            const { activoId } = req.query;
            const reports = await this.getHistoryUC.execute(activoId as string | undefined);
            res.json(reports);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
