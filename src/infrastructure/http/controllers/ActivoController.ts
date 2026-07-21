import { Request, Response } from "express";
import { CreateActivo } from "../../../application/use-cases/activo/CreateActivo";
import { GetAllActivo } from "../../../application/use-cases/activo/GetAllActivo";
import { GetOneActivo } from "../../../application/use-cases/activo/GetOneActivo";
import { UpdateActivo } from "../../../application/use-cases/activo/UpdateActivo";
import { DarDeBajaActivo } from "../../../application/use-cases/activo/DarDeBajaActivo";
import { GetActivoMetadata } from "../../../application/use-cases/activo/GetActivoMetadata";
import { FindByIdActivo } from "../../../application/use-cases/activo/FindByActivo";
import { GetDashboardSummary } from "../../../application/use-cases/activo/GetDashboardSummary";
import { CreateTipoActivo } from "../../../application/use-cases/tipoActivo/CreateTipoActivo";
import { GetAllTipoActivo } from "../../../application/use-cases/tipoActivo/GetAllTipoActivo";
import { UpdateTipoActivo } from "../../../application/use-cases/tipoActivo/UpdateTipoActivo";

export class ActivoController {
    constructor(
        private createActivo: CreateActivo,
        private getAllActivo: GetAllActivo,
        private getOneActivo: GetOneActivo,
        private updateActivo: UpdateActivo,
        private darDeBajaActivo: DarDeBajaActivo,
        private getMetadataUseCase: GetActivoMetadata,
        private findByIdActivo: FindByIdActivo,
        private getDashboardSummaryUseCase: GetDashboardSummary,
        private createTipoActivoUC: CreateTipoActivo,
        private getAllTipoActivoUC: GetAllTipoActivo,
        private updateTipoActivoUC: UpdateTipoActivo
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
     *     summary: Obtener todos los activos
     *     tags: [Activos]
     *     responses:
     *       200:
     *         description: Lista de activos
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Activo'
     */
    async getAll(req: Request, res: Response) {
        try {
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
            const { id } = req.params;
            const activo = await this.getOneActivo.execute({ placa: id as string });
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
     * /api/activos/{placa}/baja:
     *   patch:
     *     summary: Dar de baja un activo
     *     tags: [Activos]
     *     parameters:
     *       - in: path
     *         name: placa
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Activo dado de baja
     */
    async darDeBaja(req: Request, res: Response) {
        try {
            const { placa } = req.params;
            const activo = await this.darDeBajaActivo.execute({ placa: placa as string });
            res.json(activo);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
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
     * /api/activos/{id}:
     *   get:
     *     summary: Obtener un activo por su ID
     *     tags: [Activos]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: ID único del activo
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
    async findByActivo(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const activo = await this.findByIdActivo.execute({ id: id as string });
            res.json(activo);
        } catch (error: any) {
            res.status(404).json({ message: error.message });
        }
    }

    async createTipoActivo(req: Request, res: Response) {
        try {
            const { nombre, estado } = req.body;
            const newType = await this.createTipoActivoUC.execute({ nombre, estado });
            res.status(201).json(newType.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async getAllTipoActivo(req: Request, res: Response) {
        try {
            const tipos = await this.getAllTipoActivoUC.execute();
            res.json(tipos.map(t => t.toJSON()));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

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
