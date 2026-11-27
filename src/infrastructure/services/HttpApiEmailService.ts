import { randomUUID } from 'node:crypto';
import { Movement } from '../../domain/entities/Movement';
import { IEmailService } from '../../domain/services/IEmailService';
import * as path from 'path';
import * as fs from 'fs';
import {
    buildMovementNotificationHtml,
    buildMovementReceiptHtml,
    buildTelemetryAlertHtml,
    MovementEmailDetails,
    MovementReceiptEmailDetails,
    TelemetryAlertEmailDetails
} from './EmailHtmlTemplates';

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
        details: MovementEmailDetails
    ): Promise<string | null> {
        if (!recipients || recipients.length === 0) {
            console.log('ℹ️ [HttpApiEmailService] No se suministraron destinatarios para el movimiento', movement.id);
            return null;
        }

        let targetEvent = 'DESPACHO_TRASLADO';
        let subjectPrefix = '🚚 [Inventario] Notificación de Traslado';
        if (movement.type === 'HURTO_PERDIDA') {
            targetEvent = 'HURTO_PERDIDA';
            subjectPrefix = '🚨 [Seguridad/Inventario] Reporte de Hurto / Pérdida';
        } else if (movement.type === 'BAJA_ACTIVO') {
            targetEvent = 'BAJA_ACTIVO';
            subjectPrefix = '📋 [Contabilidad/Inventario] Baja Definitiva de Activo';
        }

        const { dbActiveCc, dbActiveBcc } = await this.fetchEventRecipients(targetEvent);
        const to = recipients[0]?.trim() || dbActiveCc[0] || process.env.SMTP_USER || 'inventario@flotalamacarena.com';
        const userCc = recipients.slice(1).map(r => r.trim()).filter(Boolean);
        const { cc, bcc } = this.mergeCopyLists(to, [...userCc, ...dbActiveCc], dbActiveBcc);

        const movIdShort = (movement.id || '').slice(0, 8);
        const subject = movement.type === 'HURTO_PERDIDA'
            ? `${subjectPrefix}: Placa [${details.activos.map(a => a.placa).join(', ')}] - ${details.originLocation} (#${movIdShort})`
            : `${subjectPrefix}: ${details.originLocation} ➔ ${details.destinationLocation} (#${movIdShort})`;

        const bodyHtml = buildMovementNotificationHtml(movement, details);
        const attachments = await this.resolveAttachments(movement);
        return this.dispatchMailApi(to, cc, bcc, subject, bodyHtml, attachments, 'notificación de movimiento', true);
    }

    async sendMovementReceiptNotification(
        movement: Movement,
        details: MovementReceiptEmailDetails
    ): Promise<string | null> {
        const { dbActiveCc, dbActiveBcc } = await this.fetchEventRecipients('RECEPCION_TRASLADO');
        const to = dbActiveCc.length > 0 ? dbActiveCc[0] : (process.env.SMTP_USER || 'inventario@flotalamacarena.com');
        const cc = dbActiveCc.slice(1);
        const bcc = dbActiveBcc;

        const movIdShort = (movement.id || '').slice(0, 8);
        const subject = `✅ [Inventario] Recepción Confirmada: ${details.originLocation} ➔ ${details.destinationLocation} (#${movIdShort})`;
        const bodyHtml = buildMovementReceiptHtml(movement, details);
        const attachments = await this.resolveAttachments(movement);

        return this.dispatchMailApi(to, cc, bcc, subject, bodyHtml, attachments, 'confirmación de recepción', false);
    }

    async sendUnauthorizedLocationAlert(details: TelemetryAlertEmailDetails): Promise<string | null> {
        let { dbActiveCc, dbActiveBcc } = await this.fetchEventRecipients('MOVIMIENTO_NO_AUTORIZADO', true);
        const envCc = this.parseEnvAddressList(process.env.MAIL_DEFAULT_CC);
        const envBcc = this.parseEnvAddressList(process.env.MAIL_DEFAULT_BCC);

        const to = dbActiveCc[0] || dbActiveBcc[0] || envCc[0] || details.responsibleEmail || process.env.SMTP_USER || 'inventario@flotalamacarena.com';
        const { cc, bcc } = this.mergeCopyLists(
            to,
            [...dbActiveCc, ...(details.responsibleEmail ? [details.responsibleEmail] : [])],
            dbActiveBcc
        );

        const subject = details.tamperingType
            ? `🚨 [ALERTA ANTI-SABOTAJE] ${details.tamperingType} - Placa [${details.placa}]`
            : `🚨 [Alerta Telemetría] Posible Movimiento No Autorizado - Placa [${details.placa}] (${details.distanceKm} km fuera de sede)`;

        const bodyHtml = buildTelemetryAlertHtml(details);
        const uuid = await this.dispatchMailApi(
            to,
            cc,
            bcc,
            subject,
            bodyHtml,
            [{ filename: '', mimetype: '', content: '' }],
            'alerta de telemetría',
            false
        );
        return uuid || randomUUID();
    }

    private async fetchEventRecipients(
        eventKey: string,
        fallbackToAllActive: boolean = false
    ): Promise<{ dbActiveCc: string[]; dbActiveBcc: string[] }> {
        try {
            const { recipientRepo } = await import('../http/routes/NotificationRecipientRoutes');
            let dbRecipients = await recipientRepo.findActiveByEvent(eventKey);
            if (fallbackToAllActive && dbRecipients.length === 0) {
                dbRecipients = await recipientRepo.findActive();
            }
            return {
                dbActiveCc: dbRecipients.filter(r => r.tipoCopia === 'CC').map(r => r.email),
                dbActiveBcc: dbRecipients.filter(r => r.tipoCopia === 'BCC').map(r => r.email)
            };
        } catch {
            return { dbActiveCc: [], dbActiveBcc: [] };
        }
    }

    private parseEnvAddressList(raw?: string): string[] {
        return (raw || '').split(',').map(e => e.trim()).filter(Boolean);
    }

    private mergeCopyLists(to: string, baseCc: string[], baseBcc: string[]): { cc: string[]; bcc: string[] } {
        const envCc = this.parseEnvAddressList(process.env.MAIL_DEFAULT_CC);
        const envBcc = this.parseEnvAddressList(process.env.MAIL_DEFAULT_BCC);
        const cc = Array.from(new Set([...baseCc, ...envCc])).filter(e => e && e.toLowerCase() !== to.toLowerCase());
        const bcc = Array.from(new Set([...baseBcc, ...envBcc])).filter(
            e => e && e.toLowerCase() !== to.toLowerCase() && !cc.includes(e)
        );
        return { cc, bcc };
    }

    private async dispatchMailApi(
        to: string,
        cc: string[],
        bcc: string[],
        subject: string,
        bodyHtml: string,
        attachments: AttachmentItem[],
        label: string,
        throwOnHttpError: boolean
    ): Promise<string | null> {
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

        this.saveDebugPreview(bodyHtml);
        console.log(`📡 [HttpApiEmailService] Enviando ${label} vía API a ${this.apiUrl} (UUID: ${generatedUuid})...`);

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
                console.error(`❌ [HttpApiEmailService] Error HTTP ${response.status} en ${label}: ${errorText}`);
                if (throwOnHttpError) {
                    throw new Error(`Error en API de correo (${response.status}): ${errorText || response.statusText}`);
                }
                return null;
            }

            const responseData = await response.json().catch(() => null) as any;
            console.log(`✅ [HttpApiEmailService] ${label} despachada exitosamente. UUID: ${generatedUuid}`);
            return (responseData && responseData.uuid) ? responseData.uuid : generatedUuid;
        } catch (error: any) {
            console.error(`❌ [HttpApiEmailService] Error al conectar para ${label} (${this.apiUrl}):`, error?.message || error);
            return null;
        }
    }

    private async resolveAttachments(movement: Movement): Promise<AttachmentItem[]> {
        const attachmentUrls: Array<{ url: string; defaultName: string }> = [];
        if (movement.documentUrl) attachmentUrls.push({ url: movement.documentUrl, defaultName: `comodato_${movement.id?.slice(0, 8) || 'doc'}` });
        if (movement.evidenceUrl) attachmentUrls.push({ url: movement.evidenceUrl, defaultName: `guia_despacho_${movement.id?.slice(0, 8) || 'envio'}` });
        if (movement.receivedEvidenceUrl) attachmentUrls.push({ url: movement.receivedEvidenceUrl, defaultName: `soporte_recepcion_${movement.id?.slice(0, 8) || 'rec'}` });

        const validAttachments: AttachmentItem[] = [];
        for (const item of attachmentUrls) {
            try {
                const att = await this.fetchAttachmentAsBase64(item.url, item.defaultName);
                if (att) validAttachments.push(att);
            } catch (err) {
                console.warn(`⚠️ [HttpApiEmailService] No se pudo adjuntar ${item.url}:`, err);
            }
        }

        return validAttachments.length > 0
            ? validAttachments
            : [{ filename: '', mimetype: '', content: '' }];
    }

    private async fetchAttachmentAsBase64(url: string, defaultName: string): Promise<AttachmentItem | null> {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            const allowedEndpoint = (process.env.FILE_STORAGE_ENDPOINT || '').toLowerCase();
            const allowedPublicUrl = (process.env.FILE_STORAGE_PUBLIC_URL || '').toLowerCase();
            const isAllowedRemote =
                (allowedEndpoint && url.toLowerCase().startsWith(allowedEndpoint)) ||
                (allowedPublicUrl && url.toLowerCase().startsWith(allowedPublicUrl)) ||
                url.includes('flotalamacarena.com');

            if (!isAllowedRemote) {
                console.warn(`⚠️ [HttpApiEmailService] Intento de SSRF bloqueado: ${url}`);
                return null;
            }

            const res = await fetch(url);
            if (!res.ok) return null;
            const buffer = Buffer.from(await res.arrayBuffer());
            const contentType = res.headers.get('content-type') || this.guessMimeType(url);
            const ext = this.getExtension(url, contentType);
            return { filename: `${defaultName}${ext}`, mimetype: contentType, content: buffer.toString('base64') };
        }

        const uploadsRoot = path.resolve(process.cwd(), 'uploads');
        const resolvedLocalPath = path.resolve(url);
        if (resolvedLocalPath.startsWith(uploadsRoot) && fs.existsSync(resolvedLocalPath)) {
            const buffer = fs.readFileSync(resolvedLocalPath);
            const filename = path.basename(resolvedLocalPath) || `${defaultName}.pdf`;
            return { filename, mimetype: this.guessMimeType(filename), content: buffer.toString('base64') };
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

    private saveDebugPreview(html: string) {
        try {
            fs.writeFileSync(path.join(process.cwd(), 'email_preview_latest.html'), html, 'utf-8');
        } catch {
            // Silencioso
        }
    }
}
