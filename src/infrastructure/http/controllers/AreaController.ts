import { Request, Response } from "express";
import { CreateArea } from "../../../application/use-cases/area/CreateArea";
import { GetAllAreas } from "../../../application/use-cases/area/GetAllAreas";
import { UpdateArea } from "../../../application/use-cases/area/UpdateArea";
import { GetOneArea } from "../../../application/use-cases/area/GetOneArea";
import { InactiveArea } from "../../../application/use-cases/area/InactiveArea";
import { Area, EstadoArea } from "../../../domain/entities/Area";

export class AreaController {
    constructor(
        private readonly createArea: CreateArea,
        private readonly getAllAreas: GetAllAreas,
        private readonly updateArea: UpdateArea,
        private readonly getOneArea: GetOneArea,
        private readonly inactiveArea: InactiveArea
    ) { }

    /**
     * @swagger
     * /api/areas:
     *   post:
     *     summary: Crear una nueva área
     *     tags: [Áreas]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Area'
     *     responses:
     *       201:
     *         description: Área creada con éxito
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Area'
     */
    async create(req: Request, res: Response) {
        try {
            const area = new Area({
                code: req.body.code,
                nombre: req.body.nombre,
                estado: req.body.estado || EstadoArea.ACTIVO
            });
            const result = await this.createArea.execute(area);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/areas:
     *   get:
     *     summary: Listar todas las áreas
     *     tags: [Áreas]
     *     responses:
     *       200:
     *         description: Lista de áreas obtenidas
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Area'
     */
    async getAll(req: Request, res: Response) {
        try {
            const areas = await this.getAllAreas.execute();
            res.status(200).json(areas);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/areas/{id}:
     *   get:
     *     summary: Obtener una área por su ID
     *     tags: [Áreas]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: ID único del área
     *     responses:
     *       200:
     *         description: Área encontrada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Area'
     *       404:
     *         description: Área no encontrada
     */
    async getOne(req: Request, res: Response) {
        try {
            const area = await this.getOneArea.execute(req.params.id as string);
            if (!area) {
                res.status(404).json({ message: "Área no encontrada" });
                return;
            }
            res.status(200).json(area);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/areas/{id}:
     *   put:
     *     summary: Actualizar una área
     *     tags: [Áreas]
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
     *             $ref: '#/components/schemas/Area'
     *     responses:
     *       200:
     *         description: Área actualizada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Area'
     */
    async update(req: Request, res: Response) {
        try {
            const area = new Area({
                id: req.params.id as string,
                code: req.body.code,
                nombre: req.body.nombre,
                estado: req.body.estado
            });
            const result = await this.updateArea.execute(area);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/areas/{id}/inactive:
     *   patch:
     *     summary: Activar o Inactivar una área
     *     tags: [Áreas]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               action:
     *                 type: string
     *                 enum: [ACTIVATE, INACTIVATE]
     *     responses:
     *       200:
     *         description: Estado de área actualizado con éxito
     */
    async inactive(req: Request, res: Response) {
        try {
            const action = req.body.action || 'INACTIVATE';
            const result = await this.inactiveArea.execute(req.params.id as string, action);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
