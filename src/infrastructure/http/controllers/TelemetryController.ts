import { Request, Response } from 'express';
import { RegisterDeviceHeartbeat } from '../../../application/use-cases/telemetry/RegisterDeviceHeartbeat';
import { GetActivoTelemetry } from '../../../application/use-cases/telemetry/GetActivoTelemetry';
import { IEmailService } from '../../../domain/services/IEmailService';
import { IWhatsAppNotificationService } from '../../../domain/services/IWhatsAppNotificationService';
import { IResponsibleRepository } from '../../../domain/repositories/IResponsibleRepository';
import { EstadoResponsable } from '../../../domain/entities/Responsible';

export class TelemetryController {
    constructor(
        private readonly registerHeartbeatUC: RegisterDeviceHeartbeat,
        private readonly getActivoTelemetryUC: GetActivoTelemetry,
        private readonly emailService?: IEmailService,
        private readonly whatsAppService?: IWhatsAppNotificationService,
        private readonly responsibleRepository?: IResponsibleRepository
    ) {}

    /**
     * @swagger
     * /api/telemetry/heartbeat:
     *   post:
     *     summary: Registrar reporte automático de arranque y ubicación GPS de un dispositivo (Heartbeat)
     *     description: >
     *       Recibe la placa y coordenadas GPS al iniciar el dispositivo. Verifica que el tipo de activo admita telemetría,
     *       calcula la distancia de Haversine contra la sede oficial asignada y cruza contra traslados activos o mantenimientos.
     *       Si detecta una controversia de ubicación sin autorización, emite alerta automática por correo.
     *     tags: [Telemetría y Geocercas]
     *     parameters:
     *       - in: header
     *         name: X-Device-Api-Key
     *         required: false
     *         schema:
     *           type: string
     *         description: Clave de autenticación del agente de arranque en el dispositivo (opcional si se autentica con Bearer JWT de Keycloak)
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [placa, latitud, longitud]
     *             properties:
     *               placa:
     *                 type: string
     *                 example: 'POS-001'
     *               latitud:
     *                 type: number
     *                 example: 4.142
     *               longitud:
     *                 type: number
     *                 example: -73.6266
     *               ipAddress:
     *                 type: string
     *                 example: '10.10.25.44'
     *               toleranceKm:
     *                 type: number
     *                 example: 1.5
     *     responses:
     *       201:
     *         description: Reporte de telemetría procesado y evaluado
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ActivoTelemetryLog'
     *       400:
     *         description: Placa inexistente, coordenadas inválidas o tipo de activo que no admite telemetría
     */
    async registerHeartbeat(req: Request, res: Response) {
        try {
            const { placa, latitud, longitud, ipAddress, toleranceKm, forceAlert } = req.body;
            const clientIp =
                ipAddress ||
                (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                req.socket.remoteAddress ||
                null;

            const log = await this.registerHeartbeatUC.execute({
                placa,
                latitud: Number(latitud),
                longitud: Number(longitud),
                ipAddress: clientIp,
                toleranceKm: toleranceKm !== undefined ? Number(toleranceKm) : undefined,
                forceAlert: Boolean(forceAlert)
            });
            res.status(201).json(log.toJSON());
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/telemetry/overview:
     *   get:
     *     summary: Obtener configuración global, último estado de telemetría por activo y controversias recientes
     *     tags: [Telemetría y Geocercas]
     *     responses:
     *       200:
     *         description: Resumen de telemetría, parámetros de geocerca y controversias
     */
    async getOverview(req: Request, res: Response) {
        try {
            const overview = await this.getActivoTelemetryUC.getOverview();
            res.json(overview);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/telemetry/activos/{activoId}:
     *   get:
     *     summary: Obtener el historial de reportes de arranque y ubicación de un activo específico
     *     tags: [Telemetría y Geocercas]
     *     parameters:
     *       - in: path
     *         name: activoId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Historial de telemetría del activo
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/ActivoTelemetryLog'
     */
    async getActivoHistory(req: Request, res: Response) {
        try {
            const activoId = req.params.activoId as string;
            const history = await this.getActivoTelemetryUC.getHistoryByActivo(activoId);
            res.json(history.map(h => h.toJSON()));
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/telemetry/settings:
     *   get:
     *     summary: Obtener los parámetros globales de geocerca y alertas de telemetría
     *     tags: [Telemetría y Geocercas]
     *     responses:
     *       200:
     *         description: Configuración global de geocerca
     */
    async getSettings(req: Request, res: Response) {
        try {
            const settings = await this.getActivoTelemetryUC.getSettings();
            res.json(settings);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/telemetry/settings:
     *   put:
     *     summary: Actualizar el radio de geocerca (km), ventana anti-spam (horas) y estado de alertas
     *     tags: [Telemetría y Geocercas]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               toleranceKm:
     *                 type: number
     *                 example: 1.5
     *               cooldownHours:
     *                 type: number
     *                 example: 12
     *               alertsEnabled:
     *                 type: boolean
     *                 example: true
     *     responses:
     *       200:
     *         description: Parámetros de geocerca actualizados
     */
    async updateSettings(req: Request, res: Response) {
        try {
            const updated = await this.getActivoTelemetryUC.updateSettings(req.body);
            res.json(updated);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    /**
     * @swagger
     * /api/telemetry/test-alert:
     *   post:
     *     summary: Enviar un correo de prueba de controversia de ubicación a los destinatarios suscritos
     *     tags: [Telemetría y Geocercas]
     *     responses:
     *       200:
     *         description: Correo de prueba despachado exitosamente
     */
    async sendTestAlert(req: Request, res: Response) {
        try {
            if (!this.emailService?.sendUnauthorizedLocationAlert) {
                return res.status(400).json({ message: 'El servicio de correo no soporta alertas de telemetría.' });
            }

            const sampleDetails = {
                placa: req.body?.placa || '1528-003000',
                serial: req.body?.serial || 'SN-CS30-994812',
                marca: req.body?.marca || 'Ciontek',
                modelo: req.body?.modelo || 'Smart POS CS30',
                tipoNombre: req.body?.tipoNombre || 'Dispositivo POS Móvil',
                responsibleName: req.body?.responsibleName || 'Custodio de Prueba (Auditoría TI)',
                responsibleEmail: req.body?.responsibleEmail || undefined,
                expectedLocationName: req.body?.expectedLocationName || 'Terminal del Sur - Bogotá',
                expectedLocationCoords: '4.5964, -74.1628',
                detectedLocationName: req.body?.detectedLocationName || 'Terminal Villavicencio (Meta)',
                reportedCoords: '4.1420, -73.6266',
                reportedIp: req.socket.remoteAddress || '181.54.112.90',
                distanceKm: 75.4
            };

            const uuid = await this.emailService.sendUnauthorizedLocationAlert(sampleDetails);

            let whatsappSentCount = 0;
            if (this.whatsAppService) {
                try {
                    const settings = await this.getActivoTelemetryUC.getSettings();
                    if (settings.whatsappEnabled !== false) {
                        const targets = new Map<string, string>();
                        if (req.body?.testPhone) {
                            targets.set(req.body.testPhone, 'Administrador de Prueba');
                        } else if (settings.whatsappCargoIds && settings.whatsappCargoIds.length > 0 && this.responsibleRepository) {
                            const responsibles = await this.responsibleRepository.findAll();
                            for (const r of responsibles) {
                                if (r.estado === EstadoResponsable.ACTIVO && r.telefono && r.cargo?.id && settings.whatsappCargoIds.includes(r.cargo.id)) {
                                    targets.set(r.telefono, r.nombre);
                                }
                            }
                        }

                        for (const [phone, name] of targets.entries()) {
                            await this.whatsAppService.sendUnauthorizedLocationAlert({
                                toPhone: phone,
                                recipientName: name,
                                placa: sampleDetails.placa,
                                equipoDesc: `${sampleDetails.marca} ${sampleDetails.modelo}`,
                                expectedLocationName: sampleDetails.expectedLocationName,
                                detectedLocationName: sampleDetails.detectedLocationName,
                                distanceKm: sampleDetails.distanceKm,
                                reportedCoords: sampleDetails.reportedCoords
                            });
                            whatsappSentCount++;
                        }
                    }
                } catch (waErr: any) {
                    console.warn('[TelemetryController] Error enviando WhatsApp de prueba:', waErr?.message || waErr);
                }
            }

            res.json({
                success: true,
                uuid,
                whatsappSentCount,
                message: `Alerta de prueba despachada exitosamente (Correo y ${whatsappSentCount} WhatsApp procesados).`
            });
        } catch (error: any) {
            res.status(500).json({ message: error.message || 'Error al despachar correo de prueba.' });
        }
    }
}
