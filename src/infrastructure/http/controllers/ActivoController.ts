import { Request, Response } from "express";
import { CreateActivo } from "../../../application/use-cases/activo/CreateActivo";
import { GetAllActivo } from "../../../application/use-cases/activo/GetAllActivo";
import { GetOneActivo } from "../../../application/use-cases/activo/GetOneActivo";
import { UpdateActivo } from "../../../application/use-cases/activo/UpdateActivo";
import { DarDeBajaActivo } from "../../../application/use-cases/activo/DarDeBajaActivo";
import { AssingSIMToActivo } from "../../../application/use-cases/activo/AssingSIMToActivo";
import { GetActivoMetadata } from "../../../application/use-cases/activo/GetActivoMetadata";

export class ActivoController {
    constructor(
        private createActivo: CreateActivo,
        private getAllActivo: GetAllActivo,
        private getOneActivo: GetOneActivo,
        private updateActivo: UpdateActivo,
        private darDeBajaActivo: DarDeBajaActivo,
        private assignSIMToActivo: AssingSIMToActivo,
        private getMetadataUseCase: GetActivoMetadata
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
     * /api/activos/{placa}/sim:
     *   post:
     *     summary: Asignar una SIM Card a un activo
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
     *             type: object
     *             properties:
     *               iccid:
     *                 type: string
     *     responses:
     *       200:
     *         description: SIM asignada exitosamente
     */
    async assignSIM(req: Request, res: Response) {
        try {
            const { placa } = req.params; // placa del activo
            const { iccid } = req.body;
            const result = await this.assignSIMToActivo.execute({ placa: placa as string, ICCID: iccid });
            res.json(result);
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

}
