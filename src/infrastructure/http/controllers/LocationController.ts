import { Request, Response } from "express";
import { CreateLocation } from "../../../application/use-cases/location/createLocation";
import { GetAllLocations } from "../../../application/use-cases/location/GetAllLocations";
import { UpdateLocation } from "../../../application/use-cases/location/updateLocation";
import { GetOneLocation } from "../../../application/use-cases/location/GetOneLocation";

export class LocationController {
    constructor(
        private readonly createLocation: CreateLocation,
        private readonly getAllLocations: GetAllLocations,
        private readonly updateLocation: UpdateLocation,
        private readonly getOneLocation: GetOneLocation
    ) { }

    /**
     * @swagger
     * /api/locations:
     *   post:
     *     summary: Crear una nueva ubicación
     *     tags: [Ubicaciones]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Location'
     *     responses:
     *       201:
     *         description: Ubicación creada
     *   get:
     *     summary: Listar todas las ubicaciones
     *     tags: [Ubicaciones]
     *     responses:
     *       200:
     *         description: Lista de ubicaciones
     */
    async create(req: Request, res: Response) {
        try {
            const location = await this.createLocation.execute(req.body);
            res.status(201).json(location);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/locations:
     *   get:
     *     summary: Listar todas las ubicaciones
     *     tags: [Ubicaciones]
     *     responses:
     *       200:
     *         description: Lista de ubicaciones
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Location'
     */
    async getAll(req: Request, res: Response) {
        try {
            const locations = await this.getAllLocations.execute();
            res.json(locations);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/locations/{code}:
     *   put:
     *     summary: Actualizar una ubicación
     *     tags: [Ubicaciones]
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Location'
     *     responses:
     *       200:
     *         description: Ubicación actualizada correctamente
     */
    async update(req: Request, res: Response) {
        try {
            const { code } = req.params;
            await this.updateLocation.execute({ code: code as string, ...req.body });
            res.json({ message: "Ubicación actualizada correctamente" });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/locations/{code}:
     *   get:
     *     summary: Obtener una ubicación por su código
     *     tags: [Ubicaciones]
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *         description: Código único de la ubicación
     *     responses:
     *       200:
     *         description: Ubicación encontrada
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Location'
     *       400:
     *         description: Error en la solicitud
     */
    async getOne(req: Request, res: Response) {
        try {
            const { code } = req.params;
            const location = await this.getOneLocation.execute({ code: code as string });
            res.json(location);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}