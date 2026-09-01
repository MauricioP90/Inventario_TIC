import { randomUUID } from 'node:crypto';
import { Movement } from '../../domain/entities/Movement';
import { IEmailService } from '../../domain/services/IEmailService';
import * as path from 'path';
import * as fs from 'fs';

interface AttachmentItem {
    filename: string;
    mimetype: string;
    content: string; // Base64
}

export class HttpApiEmailService implements IEmailService {
    private apiUrl: string;
    private concepto: string;

    constructor() {
        this.apiUrl = process.env.MAIL_API_URL || 'http://10.10.20.123:8016/send-mail';
        this.concepto = process.env.MAIL_CONCEPTO || 'Inventario - Traslado de Activos';
    }

    async sendMovementNotification(
        movement: Movement,
        recipients: string[],
        details: {
            activos: Array<{ placa: string; marca: string; modelo: string; serial: string }>;
            originLocation: string;
            destinationLocation: string;
            responsibleName: string;
        }
    ): Promise<string | null> {
        if (!recipients || recipients.length === 0) {
            console.log('ℹ️ [HttpApiEmailService] No se suministraron destinatarios para el movimiento', movement.id);
            return null;
        }

        // 1. Determinar el tipo de evento a consultar en el catálogo
        let targetEvent = 'DESPACHO_TRASLADO';
        let subjectPrefix = '🚚 [Inventario] Notificación de Traslado';

        if (movement.type === 'HURTO_PERDIDA') {
            targetEvent = 'HURTO_PERDIDA';
            subjectPrefix = '🚨 [Seguridad/Inventario] Reporte de Hurto / Pérdida';
        } else if (movement.type === 'BAJA_ACTIVO') {
            targetEvent = 'BAJA_ACTIVO';
            subjectPrefix = '📋 [Contabilidad/Inventario] Baja Definitiva de Activo';
        }

        // 1.1 Consultar destinatarios automáticos activos suscritos al evento correspondiente
        let dbActiveCc: string[] = [];
        let dbActiveBcc: string[] = [];
        try {
            const { recipientRepo } = await import('../http/routes/NotificationRecipientRoutes');
            const dbRecipients = await recipientRepo.findActiveByEvent(targetEvent);
            dbActiveCc = dbRecipients.filter(r => r.tipoCopia === 'CC').map(r => r.email);
            dbActiveBcc = dbRecipients.filter(r => r.tipoCopia === 'BCC').map(r => r.email);
        } catch (e) {
            // Silencioso si la BD no está disponible
        }

        // 1.2 Destinatario principal (to) y copias
        const to = recipients && recipients.length > 0
            ? recipients[0].trim()
            : (dbActiveCc.length > 0 ? dbActiveCc[0] : (process.env.SMTP_USER || 'inventario@flotalamacarena.com'));

        const userCc = recipients && recipients.length > 1 ? recipients.slice(1).map(r => r.trim()).filter(Boolean) : [];

        // 1.3 Copias administrativas globales de respaldo desde .env
        const envDefaultCc = (process.env.MAIL_DEFAULT_CC || '')
            .split(',')
            .map(e => e.trim())
            .filter(Boolean);

        const envDefaultBcc = (process.env.MAIL_DEFAULT_BCC || '')
            .split(',')
            .map(e => e.trim())
            .filter(Boolean);

        // Fusión única sin duplicados ni incluyendo el 'to'
        const allCcRaw = [...userCc, ...dbActiveCc, ...envDefaultCc];
        const cc = Array.from(new Set(allCcRaw)).filter(e => e && e.toLowerCase() !== to.toLowerCase());

        const allBccRaw = [...dbActiveBcc, ...envDefaultBcc];
        const bcc = Array.from(new Set(allBccRaw)).filter(e => e && e.toLowerCase() !== to.toLowerCase() && !cc.includes(e));

        // 2. Asunto y cuerpo HTML corporativo
        const movIdShort = (movement.id || '').slice(0, 8);
        const subject = movement.type === 'HURTO_PERDIDA'
            ? `${subjectPrefix}: Placa [${details.activos.map(a => a.placa).join(', ')}] - ${details.originLocation} (#${movIdShort})`
            : `${subjectPrefix}: ${details.originLocation} ➔ ${details.destinationLocation} (#${movIdShort})`;

        const bodyHtml = this.buildHtmlTemplate(movement, details);

        // 3. Procesar adjuntos (si existen) o generar estructura vacía obligatoria
        const attachments = await this.resolveAttachments(movement);

        // 4. Construir payload JSON exigido por la API de correo
        const generatedUuid = randomUUID();
        const payload = {
            concepto: this.concepto,
            uuid: generatedUuid,
            to,
            cc,
            bcc,
            subject,
            body: bodyHtml,
            attachments
        };

        console.log(`📡 [HttpApiEmailService] Enviando correo vía API a ${this.apiUrl}...`);
        console.log(`   -> Para (to): ${to}`);
        console.log(`   -> Copia (cc): [${cc.join(', ')}]`);
        console.log(`   -> Adjuntos procesados: ${attachments.filter(a => a.filename).length}`);
        console.log(`   -> UUID de Notificación: ${generatedUuid}`);

        // Guardar preview local en desarrollo para depuración
        this.saveDebugPreview(bodyHtml);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                console.error(`❌ [HttpApiEmailService] Error HTTP ${response.status} de la API de correo: ${errorText}`);
                throw new Error(`Error en API de correo (${response.status}): ${errorText || response.statusText}`);
            }

            const responseData = await response.json().catch(() => null) as any;
            console.log(`✅ [HttpApiEmailService] Correo despachado exitosamente por la API. UUID: ${generatedUuid}. Respuesta:`, responseData || 'OK 200');
            return (responseData && responseData.uuid) ? responseData.uuid : generatedUuid;
        } catch (error: any) {
            console.error(`❌ [HttpApiEmailService] Error al conectar con la API de correo (${this.apiUrl}):`, error.message || error);
            return null;
        }
    }

    /**
     * Notificación de Cierre y Recepción de Traslado (con soporte firmado adjunto)
     * Enviado automáticamente al confirmar la entrega en sede destino.
     */
    async sendMovementReceiptNotification(
        movement: Movement,
        details: {
            activos: any[];
            originLocation: string;
            destinationLocation: string;
            responsibleName: string;
            receiverName: string;
            receivedEvidenceUrl?: string;
        }
    ): Promise<string | null> {
        // 1. Consultar destinatarios automáticos suscritos al evento RECEPCION_TRASLADO
        let dbActiveCc: string[] = [];
        let dbActiveBcc: string[] = [];
        try {
            const { recipientRepo } = await import('../http/routes/NotificationRecipientRoutes');
            const dbRecipients = await recipientRepo.findActiveByEvent('RECEPCION_TRASLADO');
            dbActiveCc = dbRecipients.filter(r => r.tipoCopia === 'CC').map(r => r.email);
            dbActiveBcc = dbRecipients.filter(r => r.tipoCopia === 'BCC').map(r => r.email);
        } catch (e) {
            // Silencioso si la BD no está disponible
        }

        // 2. Destinatario principal: Se asigna al primer CC de la BD o fallback
        const to = dbActiveCc.length > 0 ? dbActiveCc[0] : (process.env.SMTP_USER || 'inventario@flotalamacarena.com');
        const cc = dbActiveCc.slice(1);
        const bcc = dbActiveBcc;

        // 3. Asunto y cuerpo HTML corporativo de Recepción
        const movIdShort = (movement.id || '').slice(0, 8);
        const subject = `✅ [Inventario] Recepción Confirmada: ${details.originLocation} ➔ ${details.destinationLocation} (#${movIdShort})`;
        const bodyHtml = this.buildReceiptHtmlTemplate(movement, details);

        // 4. Adjuntar soporte firmado de recibido
        const attachments = await this.resolveAttachments(movement);

        const generatedUuid = randomUUID();
        const payload = {
            concepto: this.concepto,
            uuid: generatedUuid,
            to,
            cc,
            bcc,
            subject,
            body: bodyHtml,
            attachments
        };

        console.log(`📡 [HttpApiEmailService] Enviando confirmación de recepción vía API a ${this.apiUrl}...`);
        console.log(`   -> Asunto: ${subject}`);
        console.log(`   -> UUID de Notificación: ${generatedUuid}`);

        this.saveDebugPreview(bodyHtml);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                console.error(`❌ [HttpApiEmailService] Error HTTP ${response.status} de la API de correo en recepción: ${errorText}`);
                return null;
            }

            const responseData = await response.json().catch(() => null) as any;
            console.log(`✅ [HttpApiEmailService] Confirmación de recepción despachada. UUID: ${generatedUuid}`);
            return (responseData && responseData.uuid) ? responseData.uuid : generatedUuid;
        } catch (error: any) {
            console.error(`❌ [HttpApiEmailService] Error al conectar en recepción (${this.apiUrl}):`, error.message || error);
            return null;
        }
    }

    /**
     * Descarga y codifica en Base64 los soportes del movimiento si existen.
     * Si no hay adjuntos o falla la descarga, devuelve obligatoriamente [{ filename: "", mimetype: "", content: "" }]
     */
    private async resolveAttachments(movement: Movement): Promise<AttachmentItem[]> {
        const attachmentUrls: Array<{ url: string; defaultName: string }> = [];

        if (movement.documentUrl) {
            attachmentUrls.push({ url: movement.documentUrl, defaultName: `comodato_${movement.id?.slice(0, 8) || 'doc'}` });
        }
        if (movement.evidenceUrl) {
            attachmentUrls.push({ url: movement.evidenceUrl, defaultName: `guia_despacho_${movement.id?.slice(0, 8) || 'envio'}` });
        }
        if (movement.receivedEvidenceUrl) {
            attachmentUrls.push({ url: movement.receivedEvidenceUrl, defaultName: `soporte_recepcion_${movement.id?.slice(0, 8) || 'rec'}` });
        }

        const validAttachments: AttachmentItem[] = [];

        for (const item of attachmentUrls) {
            try {
                const att = await this.fetchAttachmentAsBase64(item.url, item.defaultName);
                if (att) {
                    validAttachments.push(att);
                }
            } catch (err) {
                console.warn(`⚠️ [HttpApiEmailService] No se pudo adjuntar el archivo desde ${item.url}:`, err);
            }
        }

        // Si no hay adjuntos procesados, la API exige enviar el objeto con cadenas vacías
        if (validAttachments.length === 0) {
            return [
                {
                    filename: '',
                    mimetype: '',
                    content: ''
                }
            ];
        }

        return validAttachments;
    }

    private async fetchAttachmentAsBase64(url: string, defaultName: string): Promise<AttachmentItem | null> {
        // Manejar URL remota (MinIO / S3 o HTTP)
        if (url.startsWith('http://') || url.startsWith('https://')) {
            const res = await fetch(url);
            if (!res.ok) return null;
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = res.headers.get('content-type') || this.guessMimeType(url);
            const ext = this.getExtension(url, contentType);
            const filename = `${defaultName}${ext}`;

            return {
                filename,
                mimetype: contentType,
                content: buffer.toString('base64')
            };
        }

        // Manejar archivo en disco local
        if (fs.existsSync(url)) {
            const buffer = fs.readFileSync(url);
            const filename = path.basename(url) || `${defaultName}.pdf`;
            const mimetype = this.guessMimeType(filename);
            return {
                filename,
                mimetype,
                content: buffer.toString('base64')
            };
        }

        return null;
    }

    private guessMimeType(filenameOrUrl: string): string {
        const lower = filenameOrUrl.toLowerCase();
        if (lower.endsWith('.pdf')) return 'application/pdf';
        if (lower.endsWith('.png')) return 'image/png';
        if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
        if (lower.endsWith('.webp')) return 'image/webp';
        return 'application/octet-stream';
    }

    private getExtension(url: string, mimeType: string): string {
        const urlExt = path.extname(url.split('?')[0]);
        if (urlExt) return urlExt;
        if (mimeType.includes('pdf')) return '.pdf';
        if (mimeType.includes('png')) return '.png';
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return '.jpg';
        return '.bin';
    }

    private buildHtmlTemplate(
        movement: Movement,
        details: {
            activos: Array<{ placa: string; marca: string; modelo: string; serial: string }>;
            originLocation: string;
            destinationLocation: string;
            responsibleName: string;
        }
    ): string {
        const timestamp = new Date().toLocaleString('es-CO', {
            dateStyle: 'full',
            timeStyle: 'short',
            timeZone: 'America/Bogota'
        });

        const activosRows = details.activos.map(act => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 16px; font-weight: bold; color: #1e293b; font-family: monospace; font-size: 14px;">${act.placa}</td>
                <td style="padding: 12px 16px; color: #475569;">${act.marca}</td>
                <td style="padding: 12px 16px; color: #475569;">${act.modelo}</td>
                <td style="padding: 12px 16px; color: #64748b; font-family: monospace; font-size: 12px;">${act.serial || 'N/A'}</td>
            </tr>
        `).join('');

        let soportesHtml = '';
        if (movement.documentUrl || movement.evidenceUrl || movement.receivedEvidenceUrl) {
            const links = [];
            if (movement.documentUrl) {
                links.push(`<a href="${movement.documentUrl}" target="_blank" style="display: inline-block; background-color: #f1f5f9; color: #0f172a; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; border: 1px solid #cbd5e1; margin-right: 8px; margin-bottom: 8px;">📋 Ver Comodato/Acta ↗</a>`);
            }
            if (movement.evidenceUrl) {
                links.push(`<a href="${movement.evidenceUrl}" target="_blank" style="display: inline-block; background-color: #e0e7ff; color: #3730a3; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; border: 1px solid #c7d2fe; margin-right: 8px; margin-bottom: 8px;">🚚 Ver Guía de Envío ↗</a>`);
            }
            if (movement.receivedEvidenceUrl) {
                links.push(`<a href="${movement.receivedEvidenceUrl}" target="_blank" style="display: inline-block; background-color: #dcfce7; color: #166534; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; border: 1px solid #bbf7d0; margin-right: 8px; margin-bottom: 8px;">📦 Ver Soporte Recepción ↗</a>`);
            }
            soportesHtml = `
                <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <strong style="color: #334155; font-size: 13px; display: block; margin-bottom: 10px;">📎 Documentos y Soportes Adjuntos:</strong>
                    <div>${links.join('')}</div>
                </div>
            `;
        }

        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notificación de Movimiento de Inventario</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
        <tr>
            <td align="center">
                <!-- Contenedor Principal -->
                <table role="presentation" width="100%" style="max-width: 640px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
                    
                    <!-- Header Corporativo -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 32px 30px; text-align: left;">
                            <div style="margin-bottom: 12px;">
                                <span style="background-color: rgba(255, 255, 255, 0.2); color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 1px; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">
                                    Flota La Macarena
                                </span>
                            </div>
                            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3;">
                                Notificación de Traslado de Activos
                            </h1>
                            <p style="color: #c7d2fe; margin: 6px 0 0 0; font-size: 13px;">
                                Sistema de Gestión y Control de Inventarios
                            </p>
                        </td>
                    </tr>

                    <!-- Cuerpo Principal -->
                    <tr>
                        <td style="padding: 30px;">
                            
                            <!-- Tarjeta de Resumen de Ruta -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td width="48%">
                                                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold; color: #64748b; display: block;">📍 Sede Origen</span>
                                                    <strong style="font-size: 15px; color: #0f172a; margin-top: 2px; display: block;">${details.originLocation}</strong>
                                                </td>
                                                <td width="4%" align="center" style="color: #6366f1; font-size: 18px; font-weight: bold;">➔</td>
                                                <td width="48%" align="right">
                                                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold; color: #64748b; display: block;">📍 Sede Destino</span>
                                                    <strong style="font-size: 15px; color: #0f172a; margin-top: 2px; display: block;">${details.destinationLocation}</strong>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 20px; background-color: #ffffff; border-radius: 0 0 12px 12px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td>
                                                    <span style="font-size: 11px; color: #64748b; font-weight: 600;">👤 Responsable Receptor:</span>
                                                    <strong style="font-size: 13px; color: #1e293b; margin-left: 6px;">${details.responsibleName}</strong>
                                                </td>
                                                <td align="right">
                                                    <span style="font-size: 11px; color: #64748b; font-weight: 600;">Tipo:</span>
                                                    <span style="font-size: 11px; font-weight: bold; background-color: #ede9fe; color: #6d28d9; padding: 3px 8px; border-radius: 6px; margin-left: 6px;">${movement.type}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Tabla de Equipos -->
                            <div style="margin-bottom: 24px;">
                                <h3 style="font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">
                                    📦 Equipos y Componentes Trasladados (${details.activos.length})
                                </h3>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; font-size: 13px;">
                                    <thead>
                                        <tr style="background-color: #f1f5f9; text-align: left;">
                                            <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Placa</th>
                                            <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Marca</th>
                                            <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Modelo</th>
                                            <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Serial</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${activosRows}
                                    </tbody>
                                </table>
                            </div>

                            <!-- Observaciones -->
                            ${movement.notes ? `
                            <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 14px 16px; border-radius: 4px; margin-bottom: 20px;">
                                <strong style="color: #334155; font-size: 12px; display: block; margin-bottom: 4px;">📝 Observaciones del Despacho:</strong>
                                <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.5; font-style: italic;">
                                    "${movement.notes}"
                                </p>
                            </div>
                            ` : ''}

                            <!-- Soportes Adjuntos -->
                            ${soportesHtml}

                        </td>
                    </tr>

                    <!-- Footer Corporativo -->
                    <tr>
                        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 30px; text-align: center;">
                            <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; font-weight: 600;">
                                ID de Transacción: <span style="font-family: monospace; color: #334155;">${movement.id}</span>
                            </p>
                            <p style="margin: 0 0 10px 0; font-size: 11px; color: #94a3b8;">
                                Fecha de Emisión: ${timestamp}
                            </p>
                            <p style="margin: 0; font-size: 10px; color: #cbd5e1; line-height: 1.4;">
                                Este es un correo automático generado por el Sistema de Inventario de <strong>Flota La Macarena S.A.</strong><br>
                                Por favor no responda directamente a esta dirección de correo.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();
    }

    /**
     * Construye la plantilla HTML de Confirmación de Recepción y Cierre de Traslado
     */
    private buildReceiptHtmlTemplate(
        movement: Movement,
        details: {
            activos: Array<{ placa: string; marca: string; modelo: string; serial: string }>;
            originLocation: string;
            destinationLocation: string;
            responsibleName: string;
            receiverName: string;
            receivedEvidenceUrl?: string;
        }
    ): string {
        const timestamp = new Date().toLocaleString('es-CO', {
            dateStyle: 'full',
            timeStyle: 'short',
            timeZone: 'America/Bogota'
        });

        const activosRows = (details.activos || []).map((act, idx) => `
            <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: 700; color: #047857; font-family: monospace;">${act.placa || 'N/A'}</td>
                <td style="padding: 10px 14px; color: #334155;">${act.marca || '-'}</td>
                <td style="padding: 10px 14px; color: #475569;">${act.modelo || '-'}</td>
                <td style="padding: 10px 14px; color: #64748b; font-family: monospace; font-size: 12px;">${act.serial || 'N/A'}</td>
            </tr>
        `).join('');

        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Recepción Confirmada de Inventario - Flota La Macarena</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 650px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                    
                    <!-- Header Verde de Recepción -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #065f46 0%, #047857 60%, #059669 100%); padding: 30px; text-align: center; color: #ffffff;">
                            <div style="background-color: rgba(255,255,255,0.2); width: 44px; height: 44px; line-height: 44px; border-radius: 50%; display: inline-block; margin-bottom: 12px; font-size: 20px;">
                                ✓
                            </div>
                            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">FLOTA LA MACARENA S.A.</h1>
                            <p style="margin: 6px 0 0 0; font-size: 13px; color: #a7f3d0; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                                Confirmación de Recepción de Inventario
                            </p>
                        </td>
                    </tr>

                    <!-- Cuerpo -->
                    <tr>
                        <td style="padding: 30px 32px;">
                            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 18px; margin-bottom: 24px; text-align: center;">
                                <span style="display: block; font-size: 16px; font-weight: 800; color: #065f46; margin-bottom: 4px;">
                                    ¡Traslado Recibido a Satisfacción!
                                </span>
                                <span style="font-size: 13px; color: #047857;">
                                    Los activos han llegado a la sede de destino y la custodia física ha sido cerrada formalmente.
                                </span>
                            </div>

                            <!-- Resumen de Entrega -->
                            <table role="presentation" width="100%" style="margin-bottom: 24px; border-collapse: collapse;">
                                <tr>
                                    <td width="50%" style="padding: 12px; background-color: #f8fafc; border-radius: 10px; vertical-align: top; border: 1px solid #f1f5f9;">
                                        <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Sede Origen (Despachó)</span>
                                        <strong style="font-size: 14px; color: #0f172a; display: block; margin-top: 2px;">${details.originLocation}</strong>
                                        <span style="font-size: 12px; color: #64748b;">Resp: ${details.responsibleName}</span>
                                    </td>
                                    <td width="8"></td>
                                    <td width="50%" style="padding: 12px; background-color: #f0fdf4; border-radius: 10px; vertical-align: top; border: 1px solid #dcfce7;">
                                        <span style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; display: block;">Sede Destino (Recibió)</span>
                                        <strong style="font-size: 14px; color: #14532d; display: block; margin-top: 2px;">${details.destinationLocation}</strong>
                                        <span style="font-size: 12px; color: #166534;">Recibió: ${details.receiverName}</span>
                                    </td>
                                </tr>
                            </table>

                            <!-- Tabla de Activos Recibidos -->
                            <div style="margin-bottom: 24px;">
                                <h3 style="font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin: 0 0 12px 0;">
                                    📦 Equipos Recibidos y Verificados (${details.activos.length})
                                </h3>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; font-size: 13px;">
                                    <thead>
                                        <tr style="background-color: #f1f5f9; text-align: left;">
                                            <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Placa</th>
                                            <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Marca</th>
                                            <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Modelo</th>
                                            <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Serial</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${activosRows}
                                    </tbody>
                                </table>
                            </div>

                            <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5; font-style: italic;">
                                📎 El soporte digital firmado de recepción se encuentra adjunto a este mensaje y resguardado en el repositorio central de auditoría.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
                            <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; font-weight: 600;">
                                Transacción Cerrada: <span style="font-family: monospace; color: #334155;">${movement.id}</span>
                            </p>
                            <p style="margin: 0; font-size: 10px; color: #94a3b8;">
                                Fecha de Recepción: ${timestamp} | Sistema de Inventario Flota La Macarena
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    private saveDebugPreview(html: string) {
        try {
            const previewPath = path.join(process.cwd(), 'email_preview_latest.html');
            fs.writeFileSync(previewPath, html, 'utf-8');
        } catch (e) {
            // Silencioso
        }
    }
}
