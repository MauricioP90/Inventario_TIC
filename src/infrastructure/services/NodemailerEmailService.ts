import nodemailer, { Transporter } from 'nodemailer';
import { Movement } from '../../domain/entities/Movement';
import { IEmailService } from '../../domain/services/IEmailService';
import * as fs from 'fs';
import * as path from 'path';

export class NodemailerEmailService implements IEmailService {
    private transporter: Transporter;

    constructor() {
        const host = process.env.SMTP_HOST || 'smtp.gmail.com';
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = process.env.SMTP_SECURE === 'true' || port === 465;
        const user = process.env.SMTP_USER || '';
        const pass = process.env.SMTP_PASS || '';

        // Configuración para Gmail / Google Workspace o cualquier servidor SMTP estándar
        if (host.includes('gmail.com')) {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user,
                    pass
                }
            });
        } else {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: user ? { user, pass } : undefined,
                tls: {
                    // Evita fallos en certificados autofirmados internos
                    rejectUnauthorized: false
                }
            });
        }
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
    ): Promise<void> {
        if (!recipients || recipients.length === 0) {
            console.log('ℹ️ [NodemailerEmailService] No hay destinatarios para el movimiento', movement.id);
            return;
        }

        const from = process.env.SMTP_FROM || `"Inventario Flota La Macarena" <${process.env.SMTP_USER || 'notificaciones@flotalamacarena.com'}>`;
        const movIdShort = (movement.id || '').slice(0, 8);
        const subject = `🚚 [Inventario] Notificación de Traslado: ${details.originLocation} ➔ ${details.destinationLocation} (#${movIdShort})`;
        const html = this.buildHtmlTemplate(movement, details);
        const text = this.buildPlainText(movement, details);

        // Guardar una copia local en HTML para previsualización inmediata en desarrollo
        this.saveDebugPreview(html);

        try {
            const info = await this.transporter.sendMail({
                from,
                to: recipients.join(', '),
                subject,
                text,
                html
            });
            console.log(`✅ [NodemailerEmailService] Correo enviado exitosamente a [${recipients.join(', ')}]. Message ID: ${info.messageId}`);
        } catch (error) {
            console.error('❌ [NodemailerEmailService] Error al enviar correo:', error);
            throw error;
        }
    }

    public buildHtmlTemplate(
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

        // Soportes Documentales
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
                            <div style="display: flex; align-items: center; margin-bottom: 12px;">
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

                            <!-- Botón de acceso al sistema -->
                            <div style="margin-top: 30px; text-align: center;">
                                <a href="http://localhost:4200/movements" target="_blank" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">
                                    Ir al Módulo de Traslados en el Sistema ➔
                                </a>
                            </div>

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

    private buildPlainText(
        movement: Movement,
        details: {
            activos: Array<{ placa: string; marca: string; modelo: string; serial: string }>;
            originLocation: string;
            destinationLocation: string;
            responsibleName: string;
        }
    ): string {
        const activos = details.activos
            .map(a => `- [${a.placa}] ${a.marca} ${a.modelo} (Serial: ${a.serial || 'N/A'})`)
            .join('\n');

        return `
===================================================================
FLOTA LA MACARENA - SISTEMA DE GESTIÓN DE INVENTARIO
NOTIFICACIÓN DE TRASLADO DE ACTIVOS
===================================================================
Movimiento ID   : ${movement.id}
Tipo            : ${movement.type}
Sede Origen     : ${details.originLocation}
Sede Destino    : ${details.destinationLocation}
Receptor        : ${details.responsibleName}
Fecha           : ${new Date().toLocaleString('es-CO')}
-------------------------------------------------------------------
EQUIPOS Y COMPONENTES:
${activos}
-------------------------------------------------------------------
OBSERVACIONES:
${movement.notes || 'Sin observaciones.'}
===================================================================
        `.trim();
    }

    private saveDebugPreview(html: string) {
        try {
            const previewPath = path.join(process.cwd(), 'email_preview_latest.html');
            fs.writeFileSync(previewPath, html, 'utf-8');
        } catch (e) {
            // Silencioso si no puede escribir preview local
        }
    }
}
