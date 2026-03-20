import { Request, Response } from "express";
import { CreateResponsible } from "../../../application/use-cases/responsible/CreateResponsible";
import { GetAllResponsible } from "../../../application/use-cases/responsible/GetAllResponsible";
import { GetOneResponsible } from "../../../application/use-cases/responsible/GetOneResponsible";
import { UpdateResponsible } from "../../../application/use-cases/responsible/UpdateResponsible";
import { InactiveResponsible } from "../../../application/use-cases/responsible/InactiveResponsible";

export class ResponsibleController {
    constructor(
        private createResponsible: CreateResponsible,
        private getAllResponsible: GetAllResponsible,
        private getOneResponsible: GetOneResponsible,
        private updateResponsible: UpdateResponsible,
        private inactiveResponsible: InactiveResponsible
    ) { }

    async create(req: Request, res: Response) {
        try {
            const responsible = await this.createResponsible.execute(req.body);
            res.status(201).json(responsible);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/responsibles:
     *   get:
     *     summary: Listar todos los responsables
     *     tags: [Responsables]
     *     responses:
     *       200:
     *         description: Lista de responsables
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Responsible'
     */
    async getAll(req: Request, res: Response) {
        try {
            const responsibles = await this.getAllResponsible.execute();
            res.status(200).json(responsibles);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/responsibles/{id}:
     *   get:
     *     summary: Obtener un responsable por su ID
     *     tags: [Responsables]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: ID único del responsable
     *     responses:
     *       200:
     *         description: Responsable encontrado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Responsible'
     *       400:
     *         description: Error en la solicitud
     */
    async getOne(req: Request, res: Response) {
        try {
            const responsible = await this.getOneResponsible.execute({ id: req.params.id as string });
            res.status(200).json(responsible);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/responsibles/{id}:
     *   put:
     *     summary: Actualizar un responsable
     *     tags: [Responsables]
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
     *             $ref: '#/components/schemas/Responsible'
     *     responses:
     *       200:
     *         description: Responsable actualizado
     */
    async update(req: Request, res: Response) {
        try {
            const responsible = await this.updateResponsible.execute({ id: req.params.id as string, ...req.body });
            res.status(200).json(responsible);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/responsibles/{id}/inactive:
     *   patch:
     *     summary: Inactivar un responsable
     *     tags: [Responsables]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Responsable inactivado
     */
    async inactive(req: Request, res: Response) {
        try {
            const responsible = await this.inactiveResponsible.execute({ id: req.params.id as string });
            res.status(200).json(responsible);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}