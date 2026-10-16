import { IWhatsAppNotificationService } from '../../domain/services/IWhatsAppNotificationService';

export class WasapiNotificationService implements IWhatsAppNotificationService {
    private readonly apiKey: string;
    private readonly apiUrl: string;

    constructor() {
        this.apiKey = (process.env.WASAPI_API_KEY || '').trim();
        this.apiUrl = (process.env.WASAPI_URL || 'https://api.wasapi.io/v1/messages').trim();
    }

    private normalizePhone(phone: string): string {
        // Eliminar espacios, guiones y caracteres no numéricos
        let clean = phone.replace(/\D/g, '');

        // Si empieza con 57 y tiene 12 dígitos (57 + 10 dígitos)
        if (clean.startsWith('57') && clean.length === 12) {
            return clean;
        }

        // Si son 10 dígitos y empieza por 3 (celular colombiano estándar)
        if (clean.length === 10 && clean.startsWith('3')) {
            return `57${clean}`;
        }

        return clean;
    }

    async sendMovementDispatchNotification(params: {
        toPhone: string;
        receiverName: string;
        consecutivo: string;
        magicLinkUrl: string;
        equiposSummary: string;
        originLocation?: string;
        destinationLocation?: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }> {
        const normalizedPhone = this.normalizePhone(params.toPhone);

        const messageText = 
`🔔 *FLOTA LA MACARENA S.A. - Notificación de Envío*

Estimado(a) *${params.receiverName}*,

Se ha despachado un movimiento de inventario a su nombre (*${params.consecutivo}*).
📦 *Equipos remesados:* ${params.equiposSummary}
${params.originLocation ? `📍 *Origen:* ${params.originLocation}\n` : ''}${params.destinationLocation ? `🎯 *Destino:* ${params.destinationLocation}\n` : ''}
Por favor, al momento de recibir e inspeccionar los equipos físicamente, confirme la entrega ingresando al siguiente enlace seguro:
👉 ${params.magicLinkUrl}

_Este mensaje es generado automáticamente por el Sistema de Inventario de Flota La Macarena S.A._`;

        if (!this.apiKey || this.apiKey === 'PENDIENTE' || this.apiKey === 'tu_api_key_aqui') {
            console.log(`[Wasapi] ℹ️ MODO SIMULACIÓN (WASAPI_API_KEY no configurada aún):`);
            console.log(`[Wasapi] -> Destinatario: +${normalizedPhone} (${params.receiverName})`);
            console.log(`[Wasapi] -> Enlace: ${params.magicLinkUrl}`);
            return {
                success: true,
                messageId: `simulated-${Date.now()}`
            };
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    to: normalizedPhone,
                    recipient: normalizedPhone,
                    phone: normalizedPhone,
                    message: messageText,
                    body: messageText,
                    type: 'text'
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[Wasapi] Error HTTP ${response.status} al enviar a ${normalizedPhone}:`, errorBody);
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${errorBody}`
                };
            }

            const data = await response.json().catch(() => ({}));
            const messageId = (data as any)?.id || (data as any)?.messageId || (data as any)?.data?.id;

            console.log(`[Wasapi] ✅ Notificación enviada con éxito a +${normalizedPhone} (ID: ${messageId || 'OK'})`);
            return {
                success: true,
                messageId
            };
        } catch (error: any) {
            console.error(`[Wasapi] Excepción al enviar mensaje a ${normalizedPhone}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
