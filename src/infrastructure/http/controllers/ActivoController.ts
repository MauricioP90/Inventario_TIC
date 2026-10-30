import { Request, Response } from "express";
import { CreateActivo } from "../../../application/use-cases/activo/CreateActivo";
import { GetAllActivo } from "../../../application/use-cases/activo/GetAllActivo";
import { GetOneActivo } from "../../../application/use-cases/activo/GetOneActivo";
import { UpdateActivo } from "../../../application/use-cases/activo/UpdateActivo";
import { GetActivoMetadata } from "../../../application/use-cases/activo/GetActivoMetadata";
import { GetDashboardSummary } from "../../../application/use-cases/activo/GetDashboardSummary";
import { CreateTipoActivo } from "../../../application/use-cases/tipoActivo/CreateTipoActivo";
import { GetAllTipoActivo } from "../../../application/use-cases/tipoActivo/GetAllTipoActivo";
import { UpdateTipoActivo } from "../../../application/use-cases/tipoActivo/UpdateTipoActivo";
import { SearchActivos } from "../../../application/use-cases/activo/SearchActivos";
import { GetActivoDocumentHistory } from "../../../application/use-cases/activo/GetActivoDocumentHistory";

export class ActivoController {
    constructor(
        private createActivo: CreateActivo,
        private getAllActivo: GetAllActivo,
        private getOneActivo: GetOneActivo,
        private updateActivo: UpdateActivo,
        private getMetadataUseCase: GetActivoMetadata,
        private getDashboardSummaryUseCase: GetDashboardSummary,
        private createTipoActivoUC: CreateTipoActivo,
        private getAllTipoActivoUC: GetAllTipoActivo,
        private updateTipoActivoUC: UpdateTipoActivo,
        private searchActivosUC: SearchActivos,
        private getActivoDocumentHistoryUC?: GetActivoDocumentHistory
    ) { }

    /**
     * @swagger
     * /api/activos:
     *   post:
     *     summary: Crear un nuevo activo
     *     tags: [Activos]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Activo'
     *     responses:
     *       201:
     *         description: Activo creado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Activo'
     *       400:
     *         description: Error en la solicitud
     */
    async create(req: Request, res: Response) {
        try {
            const activo = await this.createActivo.execute(req.body);
            res.status(201).json(activo);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/activos:
     *   get:
     *     summary: Obtener o buscar activos con filtros y paginación
     *     tags: [Activos]
     *     parameters:
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: Texto para buscar en placa, serial, marca o modelo
     *       - in: query
     *         name: tipoActivoId
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Filtrar por ID de Tipo de Activo
     *       - in: query
     *         name: locationId
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Filtrar por ID de Sede / Ubicación
     *       - in: query
     *         name: responsibleId
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Filtrar por ID de Responsable
     *       - in: query
     *         name: estado
     *         schema:
     *           type: string
     *           enum: ['BODEGA', 'OPERACION', 'MANTENIMIENTO', 'BAJA']
     *         description: Filtrar por Estado del Activo
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Número de página (comienza en 1)
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: Cantidad de registros por página
     *     responses:
     *       200:
     *         description: Lista de activos o resultado de búsqueda paginado
     *         content:
     *           application/json:
     *             schema:
     *               oneOf:
     *                 - type: array
     *                   items:
     *                     $ref: '#/components/schemas/Activo'
     *                 - type: object
     *                   properties:
     *                     data:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Activo'
     *                     total:
     *                       type: integer
     *                     page:
     *                       type: integer
     *                     limit:
     *                       type: integer
     *                     totalPages:
     *                       type: integer
     */
    async getAll(req: Request, res: Response) {
        try {
            const hasQueryParams = req.query.search !== undefined ||
                req.query.tipoActivoId !== undefined ||
                req.query.locationId !== undefined ||
                req.query.responsibleId !== undefined ||
                req.query.estado !== undefined ||
                req.query.modelo !== undefined ||
                req.query.page !== undefined ||
                req.query.limit !== undefined;

            if (hasQueryParams) {
                const result = await this.searchActivosUC.execute({
                    search: req.query.search as string,
                    tipoActivoId: req.query.tipoActivoId as string,
                    locationId: req.query.locationId as string,
                    responsibleId: req.query.responsibleId as string,
                    estado: req.query.estado as string,
                    modelo: req.query.modelo as string,
                    page: req.query.page ? Number(req.query.page) : 1,
                    limit: req.query.limit ? Number(req.query.limit) : 10
                });
                return res.json(result);
            }

            const activos = await this.getAllActivo.execute();
            res.json(activos);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/activos/{placa}:
     *   get:
     *     summary: Obtener un activo por su placa
     *     tags: [Activos]
     *     parameters:
     *       - in: path
     *         name: placa
     *         required: true
     *         schema:
     *           type: string
     *         description: Placa única del activo
     *     responses:
     *       200:
     *         description: Activo encontrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Activo'
     *       404:
     *         description: Activo no encontrado
     */
    async getOne(req: Request, res: Response) {
        try {
            const placa = req.params.placa || req.params.id;
            const activo = await this.getOneActivo.execute({ placa: placa as string });
            res.json(activo);
        } catch (error: any) {
            res.status(404).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/activos/{placa}:
     *   put:
     *     summary: Actualizar un activo
     *     tags: [Activos]
     *     parameters:
     *       - in: path
     *         name: placa
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Activo'
     *     responses:
     *       200:
     *         description: Activo actualizado
     */
    async update(req: Request, res: Response) {
        try {
            const { placa } = req.params;
            const activo = await this.updateActivo.execute({ placa: placa as string, ...req.body });
            res.json(activo);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/activos/{id}/audit-history:
     *   get:
     *     summary: Obtener el historial de auditoría forense de facturas y precios de compra de un activo
     *     tags: [Activos]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: ID único del activo
     *     responses:
     *       200:
     *         description: Historial de modificaciones contables y de factura
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/ActivoDocumentHistory'
     */
    async getAuditHistory(req: Request, res: Response) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            if (!this.getActivoDocumentHistoryUC) {
                return res.json([]);
            }
            const history = await this.getActivoDocumentHistoryUC.execute({ activoId: id });
            res.json(history.map(h => h.toJSON ? h.toJSON() : h));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/activos/metadata:
     *   get:
     *     summary: Obtener metadatos de los activos
     *     tags: [Activos]
     *     responses:
     *       200:
     *         description: Metadatos de los activos
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 statuses:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: string
     *                       label:
     *                         type: string
     *                       color:
     *                         type: string
     *                 types:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: string
     *                       label:
     *                         type: string
     */
    async getActivoMetadata(req: Request, res: Response) {
        try {
            const metadata = await this.getMetadataUseCase.execute();
            res.json(metadata);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/activos/dashboard:
     *   get:
     *     summary: Obtener resumen del inventario para el Dashboard
     *     tags: [Activos]
     *     responses:
     *       200:
     *         description: Resumen con contadores por estado, sede, responsable y tipo de dispositivo
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 statusCounts:
     *                   type: object
     *                   additionalProperties:
     *                     type: integer
     *                 locationCounts:
     *                   type: object
     *                   additionalProperties:
     *                     type: integer
     *                 responsibleCounts:
     *                   type: object
     *                   additionalProperties:
     *                     type: integer
     *                 typeCounts:
     *                   type: object
     *                   additionalProperties:
     *                     type: integer
     *       500:
     *         description: Error interno del servidor
     */
    async getDashboardSummary(req: Request, res: Response) {
        try {
            const summary = await this.getDashboardSummaryUseCase.execute();
            res.json(summary);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/activos/types:
     *   post:
     *     summary: Crear un nuevo Tipo de Activo
     *     tags: [Tipos de Activo]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [nombre]
     *             properties:
     *               nombre:
     *                 type: string
     *                 example: Terminal POS
     *               estado:
     *                 type: string
     *                 enum: [ACTIVO, INACTIVO]
     *               admiteSoftware:
     *                 type: boolean
     *                 example: true
     *     responses:
     *       201:
     *         description: Tipo de activo creado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/TipoActivo'
     */
    async createTipoActivo(req: Request, res: Response) {
        try {
            const { nombre, estado, admiteSoftware, admiteTelemetria } = req.body;
            const newType = await this.createTipoActivoUC.execute({ nombre, estado, admiteSoftware, admiteTelemetria });
            res.status(201).json(newType.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/activos/types:
     *   get:
     *     summary: Listar todos los Tipos de Activo
     *     tags: [Tipos de Activo]
     *     responses:
     *       200:
     *         description: Lista de tipos de activo
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/TipoActivo'
     */
    async getAllTipoActivo(req: Request, res: Response) {
        try {
            const tipos = await this.getAllTipoActivoUC.execute();
            res.json(tipos.map(t => t.toJSON()));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/activos/types/{id}:
     *   put:
     *     summary: Actualizar un Tipo de Activo (nombre, estado o soporte de software)
     *     tags: [Tipos de Activo]
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
     *               nombre:
     *                 type: string
     *               estado:
     *                 type: string
     *                 enum: [ACTIVO, INACTIVO]
     *               admiteSoftware:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Tipo de activo actualizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/TipoActivo'
     */
    async updateTipoActivo(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updated = await this.updateTipoActivoUC.execute(id as string, req.body);
            res.json(updated.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
