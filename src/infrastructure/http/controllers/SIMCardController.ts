import { Request, Response } from "express";
import { CreateSIMCard } from "../../../application/use-cases/sim-card/CreateSIMCard";
import { GetAllSIMCards } from "../../../application/use-cases/sim-card/GetAllSiMCards";
import { UpdateSIMCard } from "../../../application/use-cases/sim-card/UpdateSIMCard";
import { GetOneSIMCard } from "../../../application/use-cases/sim-card/GetOneSIMCard";

export class SIMCardController {
    constructor(
        private readonly createSIMCard: CreateSIMCard,
        private readonly getAllSIMCards: GetAllSIMCards,
        private readonly updateSIMCard: UpdateSIMCard,
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
     *     summary: Listar SIM Cards (opcionalmente filtradas por número o ICCID)
     *     tags: [SIM Cards]
     *     parameters:
     *       - in: query
     *         name: numero
     *         required: false
     *         schema:
     *           type: string
     *         description: Filtrar por número telefónico de la línea
     *       - in: query
     *         name: iccid
     *         required: false
     *         schema:
     *           type: string
     *         description: Filtrar por código ICCID único del chip
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
            const numero = req.query.numero as string | undefined;
            const iccid = req.query.iccid as string | undefined;
            const sims = await this.getAllSIMCards.execute({ numero, iccid });
            res.json(sims);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/sim-cards/{id}:
     *   put:
     *     summary: Actualizar una SIM Card (datos de línea, asignación a activo o estado ACTIVO/BAJA)
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
