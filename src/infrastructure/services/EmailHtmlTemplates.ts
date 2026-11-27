import { Movement } from '../../domain/entities/Movement';

export function escapeHtml(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export interface MovementEmailDetails {
    activos: Array<{ placa: string; marca: string; modelo: string; serial: string }>;
    originLocation: string;
    destinationLocation: string;
    responsibleName: string;
}

export interface MovementReceiptEmailDetails {
    activos: any[];
    originLocation: string;
    destinationLocation: string;
    responsibleName: string;
    receiverName: string;
    receivedEvidenceUrl?: string;
}

export interface TelemetryAlertEmailDetails {
    placa: string;
    serial: string;
    marca: string;
    modelo: string;
    tipoNombre: string;
    responsibleName: string;
    responsibleEmail?: string;
    expectedLocationName: string;
    expectedLocationCoords?: string | null;
    detectedLocationName: string;
    reportedCoords: string;
    reportedIp?: string | null;
    distanceKm: number;
    tamperingType?: string | null;
}

export function buildMovementNotificationHtml(
    movement: Movement,
    details: MovementEmailDetails
): string {
    const timestamp = new Date().toLocaleString('es-CO', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'America/Bogota'
    });

    const activosRows = details.activos.map(act => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 16px; font-weight: bold; color: #1e293b; font-family: monospace; font-size: 14px;">${escapeHtml(act.placa)}</td>
            <td style="padding: 12px 16px; color: #475569;">${escapeHtml(act.marca)}</td>
            <td style="padding: 12px 16px; color: #475569;">${escapeHtml(act.modelo)}</td>
            <td style="padding: 12px 16px; color: #64748b; font-family: monospace; font-size: 12px;">${escapeHtml(act.serial || 'N/A')}</td>
        </tr>
    `).join('');

    let soportesHtml = '';
    if (movement.documentUrl || movement.evidenceUrl || movement.receivedEvidenceUrl) {
        const links = [];
        if (movement.documentUrl) {
            links.push(`<a href="${escapeHtml(movement.documentUrl)}" target="_blank" style="display: inline-block; background-color: #f1f5f9; color: #0f172a; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; border: 1px solid #cbd5e1; margin-right: 8px; margin-bottom: 8px;">📋 Ver Comodato/Acta ↗</a>`);
        }
        if (movement.evidenceUrl) {
            links.push(`<a href="${escapeHtml(movement.evidenceUrl)}" target="_blank" style="display: inline-block; background-color: #e0e7ff; color: #3730a3; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; border: 1px solid #c7d2fe; margin-right: 8px; margin-bottom: 8px;">🚚 Ver Guía de Envío ↗</a>`);
        }
        if (movement.receivedEvidenceUrl) {
            links.push(`<a href="${escapeHtml(movement.receivedEvidenceUrl)}" target="_blank" style="display: inline-block; background-color: #dcfce7; color: #166534; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; border: 1px solid #bbf7d0; margin-right: 8px; margin-bottom: 8px;">📦 Ver Soporte Recepción ↗</a>`);
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
                <table role="presentation" width="100%" style="max-width: 640px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
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
                    <tr>
                        <td style="padding: 30px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td width="48%">
                                                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold; color: #64748b; display: block;">📍 Sede Origen</span>
                                                    <strong style="font-size: 15px; color: #0f172a; margin-top: 2px; display: block;">${escapeHtml(details.originLocation)}</strong>
                                                </td>
                                                <td width="4%" align="center" style="color: #6366f1; font-size: 18px; font-weight: bold;">➔</td>
                                                <td width="48%" align="right">
                                                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold; color: #64748b; display: block;">📍 Sede Destino</span>
                                                    <strong style="font-size: 15px; color: #0f172a; margin-top: 2px; display: block;">${escapeHtml(details.destinationLocation)}</strong>
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
                                                    <strong style="font-size: 13px; color: #1e293b; margin-left: 6px;">${escapeHtml(details.responsibleName)}</strong>
                                                </td>
                                                <td align="right">
                                                    <span style="font-size: 11px; color: #64748b; font-weight: 600;">Tipo:</span>
                                                    <span style="font-size: 11px; font-weight: bold; background-color: #ede9fe; color: #6d28d9; padding: 3px 8px; border-radius: 6px; margin-left: 6px;">${escapeHtml(movement.type)}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
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
                                    <tbody>${activosRows}</tbody>
                                </table>
                            </div>
                            ${movement.notes ? `
                            <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 14px 16px; border-radius: 4px; margin-bottom: 20px;">
                                <strong style="color: #334155; font-size: 12px; display: block; margin-bottom: 4px;">📝 Observaciones del Despacho:</strong>
                                <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.5; font-style: italic;">"${escapeHtml(movement.notes)}"</p>
                            </div>` : ''}
                            ${soportesHtml}
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 30px; text-align: center;">
                            <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; font-weight: 600;">
                                ID de Transacción: <span style="font-family: monospace; color: #334155;">${escapeHtml(movement.id)}</span>
                            </p>
                            <p style="margin: 0 0 10px 0; font-size: 11px; color: #94a3b8;">Fecha de Emisión: ${timestamp}</p>
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
</html>`.trim();
}

export function buildMovementReceiptHtml(
    movement: Movement,
    details: MovementReceiptEmailDetails
): string {
    const timestamp = new Date().toLocaleString('es-CO', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'America/Bogota'
    });

    const activosRows = (details.activos || []).map((act, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; font-weight: 700; color: #047857; font-family: monospace;">${escapeHtml(act.placa || 'N/A')}</td>
            <td style="padding: 10px 14px; color: #334155;">${escapeHtml(act.marca || '-')}</td>
            <td style="padding: 10px 14px; color: #475569;">${escapeHtml(act.modelo || '-')}</td>
            <td style="padding: 10px 14px; color: #64748b; font-family: monospace; font-size: 12px;">${escapeHtml(act.serial || 'N/A')}</td>
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
                    <tr>
                        <td style="background: linear-gradient(135deg, #065f46 0%, #047857 60%, #059669 100%); padding: 30px; text-align: center; color: #ffffff;">
                            <div style="background-color: rgba(255,255,255,0.2); width: 44px; height: 44px; line-height: 44px; border-radius: 50%; display: inline-block; margin-bottom: 12px; font-size: 20px;">✓</div>
                            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">FLOTA LA MACARENA S.A.</h1>
                            <p style="margin: 6px 0 0 0; font-size: 13px; color: #a7f3d0; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                                Confirmación de Recepción de Inventario
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 32px;">
                            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 18px; margin-bottom: 24px; text-align: center;">
                                <span style="display: block; font-size: 16px; font-weight: 800; color: #065f46; margin-bottom: 4px;">¡Traslado Recibido a Satisfacción!</span>
                                <span style="font-size: 13px; color: #047857;">Los activos han llegado a la sede de destino y la custodia física ha sido cerrada formalmente.</span>
                            </div>
                            <table role="presentation" width="100%" style="margin-bottom: 24px; border-collapse: collapse;">
                                <tr>
                                    <td width="50%" style="padding: 12px; background-color: #f8fafc; border-radius: 10px; vertical-align: top; border: 1px solid #f1f5f9;">
                                        <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block;">Sede Origen (Despachó)</span>
                                        <strong style="font-size: 14px; color: #0f172a; display: block; margin-top: 2px;">${escapeHtml(details.originLocation)}</strong>
                                        <span style="font-size: 12px; color: #64748b;">Resp: ${escapeHtml(details.responsibleName)}</span>
                                    </td>
                                    <td width="8"></td>
                                    <td width="50%" style="padding: 12px; background-color: #f0fdf4; border-radius: 10px; vertical-align: top; border: 1px solid #dcfce7;">
                                        <span style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; display: block;">Sede Destino (Recibió)</span>
                                        <strong style="font-size: 14px; color: #14532d; display: block; margin-top: 2px;">${escapeHtml(details.destinationLocation)}</strong>
                                        <span style="font-size: 12px; color: #166534;">Recibió: ${escapeHtml(details.receiverName)}</span>
                                    </td>
                                </tr>
                            </table>
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
                                    <tbody>${activosRows}</tbody>
                                </table>
                            </div>
                            <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5; font-style: italic;">
                                📎 El soporte digital firmado de recepción se encuentra adjunto a este mensaje y resguardado en el repositorio central de auditoría.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
                            <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; font-weight: 600;">
                                Transacción Cerrada: <span style="font-family: monospace; color: #334155;">${escapeHtml(movement.id)}</span>
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
</html>`;
}

export function buildTelemetryAlertHtml(details: TelemetryAlertEmailDetails): string {
    const isTampering = Boolean(details.tamperingType);
    const alertTitle = isTampering
        ? `🚨 Intento de Sabotaje Detectado en Dispositivo (${escapeHtml(details.tamperingType)})`
        : `🚨 Controversia de Ubicación Detectada (Sin Traslado Autorizado)`;

    const alertIntro = isTampering
        ? `El agente de monitoreo ha detectado una <strong>alteración crítica en la seguridad del dispositivo (${escapeHtml(details.tamperingType)})</strong>. Esto ocurre cuando un operario revoca los permisos de ubicación, apaga el sensor GPS o utiliza simulación de coordenadas.`
        : `El servicio de arranque automático del dispositivo ha reportado una ubicación física que <strong>no coincide con su sede asignada en el inventario</strong> y no registra ninguna orden de traslado ni mantenimiento externo activo.`;

    const timestamp = new Date().toLocaleString('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
    const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(details.reportedCoords)}`;

    return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #fecaca;">
    <tr>
      <td style="background:linear-gradient(135deg,#991b1b 0%,#dc2626 100%);padding:26px 30px;color:#ffffff;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#fecaca;margin-bottom:4px;">
          Flota La Macarena · Monitoreo Automático de Activos
        </div>
        <h1 style="margin:0;font-size:20px;font-weight:800;">${alertTitle}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:26px 30px;color:#1e293b;">
        <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;">${alertIntro}</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:18px;">
          <tr>
            <td width="48%" style="vertical-align:top;padding:6px;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#64748b;">📍 Sede Oficial en Inventario</div>
              <div style="font-size:15px;font-weight:800;color:#0f172a;margin-top:4px;">${escapeHtml(details.expectedLocationName)}</div>
              <div style="font-size:11px;color:#64748b;margin-top:2px;">Coords: ${escapeHtml(details.expectedLocationCoords || 'N/A')}</div>
            </td>
            <td width="4%" style="text-align:center;font-size:20px;color:#dc2626;font-weight:bold;">➔</td>
            <td width="48%" style="vertical-align:top;padding:6px;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#dc2626;">📡 Ubicación Detectada al Encender</div>
              <div style="font-size:15px;font-weight:800;color:#b91c1c;margin-top:4px;">${escapeHtml(details.detectedLocationName)}</div>
              <div style="font-size:11px;color:#7f1d1d;margin-top:2px;">Coords: ${escapeHtml(details.reportedCoords)} (${escapeHtml(details.distanceKm)} km de desviación)</div>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="8" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;font-size:13px;margin-bottom:18px;">
          <tr style="background:#f8fafc;">
            <td><strong>Placa:</strong> ${escapeHtml(details.placa)}</td>
            <td><strong>Tipo:</strong> ${escapeHtml(details.tipoNombre)}</td>
          </tr>
          <tr>
            <td><strong>Equipo:</strong> ${escapeHtml(details.marca)} ${escapeHtml(details.modelo)}</td>
            <td><strong>Serial:</strong> ${escapeHtml(details.serial || 'N/A')}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td><strong>Custodio Actual:</strong> ${escapeHtml(details.responsibleName)}</td>
            <td><strong>IP Reportada:</strong> ${escapeHtml(details.reportedIp || 'N/D')}</td>
          </tr>
        </table>
        <div style="text-align:center;margin:20px 0;">
          <a href="${escapeHtml(mapsUrl)}" target="_blank" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:13px;font-weight:700;">
            🗺️ Ver Coordenada Exacta en Google Maps
          </a>
        </div>
        <p style="margin:0;font-size:11px;color:#64748b;text-align:center;">
          Fecha de detección: ${timestamp} | Sistema de Inventario y Telemetría Flota La Macarena
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
