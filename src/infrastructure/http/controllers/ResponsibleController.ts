import { Request, Response } from "express";
import { CreateResponsible } from "../../../application/use-cases/responsible/CreateResponsible";
import { GetAllResponsible } from "../../../application/use-cases/responsible/GetAllResponsible";
import { GetOneResponsible } from "../../../application/use-cases/responsible/GetOneResponsible";
import { UpdateResponsible } from "../../../application/use-cases/responsible/UpdateResponsible";
import { InactiveResponsible } from "../../../application/use-cases/responsible/InactiveResponsible";
import { GetResponsibleStats } from "../../../application/use-cases/responsible/GetResponsibleStats";
import { GetAllRoles } from "../../../application/use-cases/role/GetAllRoles";
import { CreateRole } from "../../../application/use-cases/role/CreateRole";
import { UpdateRole } from "../../../application/use-cases/role/UpdateRole";
import { InactiveRole } from "../../../application/use-cases/role/InactiveRole";
import { Role, EstadoRole } from "../../../domain/entities/Role";

export class ResponsibleController {
    constructor(
        private createResponsible: CreateResponsible,
        private getAllResponsible: GetAllResponsible,
        private getOneResponsible: GetOneResponsible,
        private updateResponsible: UpdateResponsible,
        private inactiveResponsible: InactiveResponsible,
        private getResponsibleStats: GetResponsibleStats,
        private getAllRoles: GetAllRoles,
        private createRoleUC: CreateRole,
        private updateRoleUC: UpdateRole,
        private inactiveRoleUC: InactiveRole
    ) { }
    /**
     * @swagger
     * /api/responsibles/roles:
     *   get:
     *     summary: Listar todos los roles disponibles
     *     tags: [Roles]
     *     responses:
     *       200:
     *         description: Lista de roles obtenidos
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Role'
     */
    async getRoles(req: Request, res: Response) {
        try {
            const roles = await this.getAllRoles.execute();
            res.status(200).json(roles);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/responsibles/roles:
     *   post:
     *     summary: Crear un nuevo rol
     *     tags: [Roles]
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
     *     responses:
     *       201:
     *         description: Rol creado con éxito
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Role'
     */
    async createRole(req: Request, res: Response) {
        try {
            const role = new Role({ nombre: req.body.nombre, estado: EstadoRole.ACTIVO });
            const result = await this.createRoleUC.execute(role);
            res.status(201).json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/responsibles/roles/{id}:
     *   put:
     *     summary: Actualizar un rol
     *     tags: [Roles]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: ID del rol
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
     *     responses:
     *       200:
     *         description: Rol actualizado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Role'
     */
    async updateRole(req: Request, res: Response) {
        try {
            const role = new Role({ id: req.params.id as string, ...req.body });
            const result = await this.updateRoleUC.execute(role);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/responsibles/roles/{id}/inactive:
     *   patch:
     *     summary: Inactivar un rol
     *     tags: [Roles]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Rol inactivado
     */
    async inactiveRole(req: Request, res: Response) {
        try {
            const result = await this.inactiveRoleUC.execute(req.params.id as string);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/responsibles:
     *   post:
     *     summary: Crear un nuevo responsable
     *     tags: [Responsables]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - nombre
     *               - email
     *               - telefono
     *               - role
     *             properties:
     *               nombre:
     *                 type: string
     *               email:
     *                 type: string
     *               telefono:
     *                 type: string
     *               role:
     *                 type: string
     *                 format: uuid
     *                 description: ID del Rol seleccionado
     *               locationIds:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: uuid
     *     responses:
     *       201:
     *         description: Responsable creado con éxito
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Responsible'
     */
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

    /**
     * @swagger
     * /api/responsibles/{id}/stats:
     *   get:
     *     summary: Obtener estadísticas de activos del responsable
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
     *         description: Estadísticas obtenidas
     */
    async getStats(req: Request, res: Response) {
        try {
            const stats = await this.getResponsibleStats.execute(req.params.id as string);
            res.status(200).json(stats);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}