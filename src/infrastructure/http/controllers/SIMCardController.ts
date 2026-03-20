import { Request, Response } from "express";
import { CreateSIMCard } from "../../../application/use-cases/sim-card/CreateSIMCard";
import { GetAllSIMCards } from "../../../application/use-cases/sim-card/GetAllSiMCards";
import { AssignSIMToActivo } from "../../../application/use-cases/sim-card/AssignSIMToActivo";
import { UpdateSIMCard } from "../../../application/use-cases/sim-card/UpdateSIMCard";
import { DarDeBajaSIM } from "../../../application/use-cases/sim-card/DarDeBajaSIM";
import { GetOneSIMCard } from "../../../application/use-cases/sim-card/GetOneSIMCard";

export class SIMCardController {
    constructor(
        private readonly createSIMCard: CreateSIMCard,
        private readonly getAllSIMCards: GetAllSIMCards,
        private readonly assignSIMToActivo: AssignSIMToActivo,
        private readonly updateSIMCard: UpdateSIMCard,
        private readonly darDeBajaSIM: DarDeBajaSIM,
        private readonly getOneSIMCard: GetOneSIMCard
    ) { }

    /**
     * @swagger
     * /api/sim-cards:
     *   post:
     *     summary: Crear una nueva SIM Card
     *     tags: [SIM Cards]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SIMCard'
     *     responses:
     *       201:
     *         description: SIM Card creada
     */
    async create(req: Request, res: Response) {
        try {
            const simCard = await this.createSIMCard.execute(req.body);
            res.status(201).json(simCard);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/sim-cards:
     *   get:
     *     summary: Listar todas las SIM Cards
     *     tags: [SIM Cards]
     *     responses:
     *       200:
     *         description: Lista de SIM Cards
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/SIMCard'
     */
    async getAll(req: Request, res: Response) {
        try {
            const sims = await this.getAllSIMCards.execute();
            res.json(sims);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/sim-cards/{simCardId}/assign:
     *   put:
     *     summary: Asignar una SIM Card a un activo (por placa)
     *     tags: [SIM Cards]
     *     parameters:
     *       - in: path
     *         name: simCardId
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
     *               placaActivo:
     *                 type: string
     *     responses:
     *       200:
     *         description: SIM asignada correctamente
     */
    async assign(req: Request, res: Response) {
        try {
            // Recibimos simCardId de la URL y placaActivo del body
            const { simCardId } = req.params;
            const { placaActivo } = req.body;

            await this.assignSIMToActivo.execute({
                simCardId: simCardId as string,
                placaActivo: placaActivo as string
            });
            await res.json({ message: "SIM asignada correctamente" });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/sim-cards/{id}/desactivate:
     *   patch:
     *     summary: Desactivar una SIM Card
     *     tags: [SIM Cards]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: SIM desactivada
     */
    async desactivate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await this.darDeBajaSIM.execute({ id: id as string });
            res.json({ message: "SIM Inactivada correctamente" });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }


    /**
     * @swagger
     * /api/sim-cards/{id}:
     *   put:
     *     summary: Actualizar una SIM Card
     *     tags: [SIM Cards]
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
     *             $ref: '#/components/schemas/SIMCard'
     *     responses:
     *       200:
     *         description: SIM actualizada
     */
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await this.updateSIMCard.execute({ id, ...req.body });
            res.json({ message: "SIM actualizada correctamente" });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/sim-cards/{id}:
     *   get:
     *     summary: Obtener una SIM Card por su ID
     *     tags: [SIM Cards]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: ID único de la SIM Card
     *     responses:
     *       200:
     *         description: SIM Card encontrada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SIMCard'
     *       400:
     *         description: Error en la solicitud
     */
    async getOne(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const simCard = await this.getOneSIMCard.execute({ id: id as string });
            res.json(simCard);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
