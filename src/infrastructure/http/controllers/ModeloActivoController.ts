import { Request, Response } from "express";
import { CreateModeloActivo } from "../../../application/use-cases/modeloActivo/CreateModeloActivo";
import { GetAllModelosActivo } from "../../../application/use-cases/modeloActivo/GetAllModelosActivo";
import { UpdateModeloActivo } from "../../../application/use-cases/modeloActivo/UpdateModeloActivo";
import { DeleteModeloActivo } from "../../../application/use-cases/modeloActivo/DeleteModeloActivo";

export class ModeloActivoController {
    constructor(
        private readonly createModeloActivoUC: CreateModeloActivo,
        private readonly getAllModelosActivoUC: GetAllModelosActivo,
        private readonly updateModeloActivoUC: UpdateModeloActivo,
        private readonly deleteModeloActivoUC: DeleteModeloActivo
    ) {}

    /**
     * @swagger
     * /api/modelos-activos:
     *   post:
     *     summary: Registrar una nueva combinación homologada de Marca y Modelo para un Tipo de Activo
     *     tags: [Modelos de Activo]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [tipoActivoId, marca, modelo]
     *             properties:
     *               tipoActivoId:
     *                 type: string
     *                 format: uuid
     *               marca:
     *                 type: string
     *                 example: Sunmi
     *               modelo:
     *                 type: string
     *                 example: V2 Pro
     *               estado:
     *                 type: string
     *                 enum: [ACTIVO, INACTIVO]
     *     responses:
     *       201:
     *         description: Modelo homologado creado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ModeloActivo'
     *       400:
     *         description: Error de validación o duplicidad
     */
    async create(req: Request, res: Response) {
        try {
            const { tipoActivoId, marca, modelo, estado } = req.body;
            const nuevo = await this.createModeloActivoUC.execute({ tipoActivoId, marca, modelo, estado });
            res.status(201).json(nuevo.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/modelos-activos:
     *   get:
     *     summary: Listar marcas y modelos homologados (opcionalmente filtrados por tipoActivoId)
     *     tags: [Modelos de Activo]
     *     parameters:
     *       - in: query
     *         name: tipoActivoId
     *         required: false
     *         schema:
     *           type: string
     *           format: uuid
     *         description: ID del tipo de activo para filtrar sus marcas y modelos
     *     responses:
     *       200:
     *         description: Lista de marcas y modelos homologados
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/ModeloActivo'
     */
    async getAll(req: Request, res: Response) {
        try {
            const tipoActivoId = req.query.tipoActivoId as string | undefined;
            const modelos = await this.getAllModelosActivoUC.execute(tipoActivoId);
            res.json(modelos.map(m => m.toJSON()));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/modelos-activos/{id}:
     *   put:
     *     summary: Actualizar la marca, nombre de modelo o estado de un modelo homologado
     *     tags: [Modelos de Activo]
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
     *               marca:
     *                 type: string
     *               modelo:
     *                 type: string
     *               estado:
     *                 type: string
     *                 enum: [ACTIVO, INACTIVO]
     *     responses:
     *       200:
     *         description: Modelo actualizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ModeloActivo'
     */
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const actualizado = await this.updateModeloActivoUC.execute(id as string, req.body);
            res.json(actualizado.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/modelos-activos/{id}:
     *   delete:
     *     summary: Eliminar un modelo homologado del catálogo
     *     tags: [Modelos de Activo]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       204:
     *         description: Modelo eliminado exitosamente
     */
    async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await this.deleteModeloActivoUC.execute(id as string);
            res.status(204).send();
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
