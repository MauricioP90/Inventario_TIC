import { Request, Response } from "express";
import { CreateSoftwareApp } from "../../../application/use-cases/software/CreateSoftwareApp";
import { GetAllSoftwareApps } from "../../../application/use-cases/software/GetAllSoftwareApps";
import { AddSoftwareVersion } from "../../../application/use-cases/software/AddSoftwareVersion";
import { GetAppVersions } from "../../../application/use-cases/software/GetAppVersions";
import { SetVigenteVersion } from "../../../application/use-cases/software/SetVigenteVersion";
import { InstallActivoSoftware } from "../../../application/use-cases/software/InstallActivoSoftware";
import { UpgradeActivoSoftware } from "../../../application/use-cases/software/UpgradeActivoSoftware";
import { RetireActivoSoftware } from "../../../application/use-cases/software/RetireActivoSoftware";
import { GetActivoInstalledSoftware } from "../../../application/use-cases/software/GetActivoInstalledSoftware";
import { GetActivoSoftwareHistory } from "../../../application/use-cases/software/GetActivoSoftwareHistory";

export class SoftwareController {
    constructor(
        private readonly createSoftwareAppUC: CreateSoftwareApp,
        private readonly getAllSoftwareAppsUC: GetAllSoftwareApps,
        private readonly addSoftwareVersionUC: AddSoftwareVersion,
        private readonly getAppVersionsUC: GetAppVersions,
        private readonly setVigenteVersionUC: SetVigenteVersion,
        private readonly installActivoSoftwareUC: InstallActivoSoftware,
        private readonly upgradeActivoSoftwareUC: UpgradeActivoSoftware,
        private readonly retireActivoSoftwareUC: RetireActivoSoftware,
        private readonly getActivoInstalledSoftwareUC: GetActivoInstalledSoftware,
        private readonly getActivoSoftwareHistoryUC: GetActivoSoftwareHistory
    ) {}

    /**
     * @swagger
     * /api/software/apps:
     *   post:
     *     summary: Registrar un nuevo Aplicativo Corporativo en el catálogo
     *     tags: [Software y Versiones]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [nombre]
     *             properties:
     *               nombre:
     *                 type: string
     *                 example: Xone POS
     *               descripcion:
     *                 type: string
     *                 example: Aplicativo móvil de expedición de tiquetes
     *               estado:
     *                 type: string
     *                 enum: [ACTIVO, INACTIVO]
     *     responses:
     *       201:
     *         description: Aplicativo creado exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SoftwareApp'
     */
    async createApp(req: Request, res: Response) {
        try {
            const { nombre, descripcion, estado } = req.body;
            const app = await this.createSoftwareAppUC.execute({ nombre, descripcion, estado });
            res.status(201).json(app.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/software/apps:
     *   get:
     *     summary: Listar todos los Aplicativos Corporativos registrados
     *     tags: [Software y Versiones]
     *     responses:
     *       200:
     *         description: Lista de aplicativos
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/SoftwareApp'
     */
    async getAllApps(req: Request, res: Response) {
        try {
            const apps = await this.getAllSoftwareAppsUC.execute();
            res.json(apps.map(a => a.toJSON()));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/software/apps/{appId}/versions:
     *   post:
     *     summary: Registrar una nueva versión para un Aplicativo Corporativo
     *     tags: [Software y Versiones]
     *     parameters:
     *       - in: path
     *         name: appId
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
     *             required: [version]
     *             properties:
     *               version:
     *                 type: string
     *                 example: '1.02'
     *               esVigente:
     *                 type: boolean
     *                 example: true
     *               notasLanzamiento:
     *                 type: string
     *                 example: Corrección de sincronización offline
     *               fechaLanzamiento:
     *                 type: string
     *                 format: date-time
     *     responses:
     *       201:
     *         description: Versión registrada exitosamente
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SoftwareVersion'
     */
    async addVersion(req: Request, res: Response) {
        try {
            const appId = req.params.appId as string;
            const { version, esVigente, notasLanzamiento, fechaLanzamiento } = req.body;
            const v = await this.addSoftwareVersionUC.execute({
                softwareAppId: appId,
                version,
                esVigente,
                notasLanzamiento,
                fechaLanzamiento: fechaLanzamiento ? new Date(fechaLanzamiento) : undefined
            });
            res.status(201).json(v.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/software/apps/{appId}/versions:
     *   get:
     *     summary: Listar todas las versiones de un Aplicativo Corporativo
     *     tags: [Software y Versiones]
     *     parameters:
     *       - in: path
     *         name: appId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Lista de versiones del aplicativo
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/SoftwareVersion'
     */
    async getAppVersions(req: Request, res: Response) {
        try {
            const appId = req.params.appId as string;
            const versions = await this.getAppVersionsUC.execute(appId);
            res.json(versions.map(v => v.toJSON()));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/software/versions/{versionId}/vigente:
     *   put:
     *     summary: Establecer una versión específica como la versión oficial vigente del aplicativo
     *     tags: [Software y Versiones]
     *     parameters:
     *       - in: path
     *         name: versionId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Versión marcada como vigente oficial
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SoftwareVersion'
     */
    async setVigenteVersion(req: Request, res: Response) {
        try {
            const versionId = req.params.versionId as string;
            const v = await this.setVigenteVersionUC.execute(versionId);
            res.json(v.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/software/activos/{activoId}/install:
     *   post:
     *     summary: Instalar un aplicativo y versión en un activo
     *     tags: [Software y Versiones]
     *     parameters:
     *       - in: path
     *         name: activoId
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
     *             required: [softwareVersionId]
     *             properties:
     *               softwareVersionId:
     *                 type: string
     *                 format: uuid
     *               licencia:
     *                 type: string
     *               observaciones:
     *                 type: string
     *     responses:
     *       201:
     *         description: Software instalado en el activo
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ActivoSoftwareHistory'
     */
    async installSoftware(req: Request, res: Response) {
        try {
            const activoId = req.params.activoId as string;
            const { softwareVersionId, licencia, observaciones } = req.body;
            const user = (req as any).kauth?.grant?.access_token?.content?.preferred_username || 'sistema';

            const item = await this.installActivoSoftwareUC.execute({
                activoId,
                softwareVersionId,
                licencia,
                instaladoPor: user,
                observaciones
            });
            res.status(201).json(item.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/software/activos/{activoId}/upgrade:
     *   put:
     *     summary: Actualizar un aplicativo instalado en un activo a una nueva versión (conservando trazabilidad histórica)
     *     tags: [Software y Versiones]
     *     parameters:
     *       - in: path
     *         name: activoId
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
     *             required: [newSoftwareVersionId]
     *             properties:
     *               newSoftwareVersionId:
     *                 type: string
     *                 format: uuid
     *               licencia:
     *                 type: string
     *               observaciones:
     *                 type: string
     *     responses:
     *       200:
     *         description: Versión actualizada exitosamente en el activo
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ActivoSoftwareHistory'
     */
    async upgradeSoftware(req: Request, res: Response) {
        try {
            const activoId = req.params.activoId as string;
            const { newSoftwareVersionId, licencia, observaciones } = req.body;
            const user = (req as any).kauth?.grant?.access_token?.content?.preferred_username || 'sistema';

            const item = await this.upgradeActivoSoftwareUC.execute({
                activoId,
                newSoftwareVersionId,
                licencia,
                actualizadoPor: user,
                observaciones
            });
            res.json(item.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/software/history/{historyId}/retire:
     *   put:
     *     summary: Desinstalar o retirar un aplicativo activo de un equipo con motivo de auditoría
     *     tags: [Software y Versiones]
     *     parameters:
     *       - in: path
     *         name: historyId
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
     *               motivoRetiro:
     *                 type: string
     *                 example: Equipo reasignado a otra operación
     *     responses:
     *       200:
     *         description: Aplicativo retirado del activo
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ActivoSoftwareHistory'
     */
    async retireSoftware(req: Request, res: Response) {
        try {
            const historyId = req.params.historyId as string;
            const { motivoRetiro } = req.body;
            const user = (req as any).kauth?.grant?.access_token?.content?.preferred_username || 'sistema';

            const item = await this.retireActivoSoftwareUC.execute({
                historyId,
                retiradoPor: user,
                motivoRetiro
            });
            res.json(item.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/software/activos/{activoId}/installed:
     *   get:
     *     summary: Obtener los aplicativos actualmente instalados en un activo junto con la evaluación de su semáforo de vigencia
     *     tags: [Software y Versiones]
     *     parameters:
     *       - in: path
     *         name: activoId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Lista de aplicativos instalados y su semáforo de vigencia
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/InstalledSoftwareEvaluation'
     */
    async getInstalledSoftware(req: Request, res: Response) {
        try {
            const activoId = req.params.activoId as string;
            const result = await this.getActivoInstalledSoftwareUC.execute(activoId);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/software/activos/{activoId}/history:
     *   get:
     *     summary: Obtener el historial completo de instalaciones, actualizaciones y retiros de software de un activo
     *     tags: [Software y Versiones]
     *     parameters:
     *       - in: path
     *         name: activoId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Historial de auditoría de software del activo
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/ActivoSoftwareHistory'
     */
    async getHistory(req: Request, res: Response) {
        try {
            const activoId = req.params.activoId as string;
            const history = await this.getActivoSoftwareHistoryUC.execute(activoId);
            res.json(history);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}
