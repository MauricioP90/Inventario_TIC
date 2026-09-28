import { Request, Response } from "express";
import { GetAllCargos } from "../../../application/use-cases/cargo/GetAllCargos";
import { CreateCargo } from "../../../application/use-cases/cargo/CreateCargo";
import { UpdateCargo } from "../../../application/use-cases/cargo/UpdateCargo";
import { ToggleCargoStatus } from "../../../application/use-cases/cargo/ToggleCargoStatus";

export class CargoController {
    constructor(
        private readonly getAllCargosUC: GetAllCargos,
        private readonly createCargoUC: CreateCargo,
        private readonly updateCargoUC: UpdateCargo,
        private readonly toggleCargoStatusUC: ToggleCargoStatus
    ) { }

    /**
     * @swagger
     * /api/cargos:
     *   get:
     *     summary: Listar todos los cargos organizacionales
     *     tags: [Cargos]
     *     responses:
     *       200:
     *         description: Lista de cargos registrados
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Cargo'
     *       500:
     *         description: Error interno del servidor
     */
    async getAll(req: Request, res: Response) {
        try {
            const cargos = await this.getAllCargosUC.execute();
            res.status(200).json(cargos.map(c => c.toJSON()));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/cargos:
     *   post:
     *     summary: Crear un nuevo cargo organizacional
     *     tags: [Cargos]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - nombre
     *             properties:
     *               nombre:
     *                 type: string
     *                 example: 'Analista de Sistemas'
     *               estado:
     *                 type: string
     *                 enum: ['ACTIVO', 'INACTIVO']
     *                 default: 'ACTIVO'
     *     responses:
     *       201:
     *         description: Cargo creado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Cargo'
     *       400:
     *         description: Datos inválidos o cargo ya existente
     */
    async create(req: Request, res: Response) {
        try {
            const { nombre, estado } = req.body;
            if (!nombre) {
                return res.status(400).json({ message: "El nombre del cargo es obligatorio" });
            }
            const cargo = await this.createCargoUC.execute(nombre, estado);
            res.status(201).json(cargo.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/cargos/{id}:
     *   put:
     *     summary: Actualizar el nombre o estado de un cargo
     *     tags: [Cargos]
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
     *                 example: 'Coordinador de Operaciones'
     *               estado:
     *                 type: string
     *                 enum: ['ACTIVO', 'INACTIVO']
     *     responses:
     *       200:
     *         description: Cargo actualizado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Cargo'
     *       400:
     *         description: Error en los datos o cargo no encontrado
     */
    async update(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const { nombre, estado } = req.body;
            const cargo = await this.updateCargoUC.execute(id, nombre, estado);
            res.status(200).json(cargo.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/cargos/{id}/toggle-status:
     *   patch:
     *     summary: Alternar el estado (ACTIVO / INACTIVO) de un cargo
     *     tags: [Cargos]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Estado alternado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Cargo'
     *       400:
     *         description: Cargo no encontrado
     */
    async toggleStatus(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const cargo = await this.toggleCargoStatusUC.execute(id);
            res.status(200).json(cargo.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
