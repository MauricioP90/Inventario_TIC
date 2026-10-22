import { IWhatsAppNotificationService } from '../../domain/services/IWhatsAppNotificationService';

export class WasapiNotificationService implements IWhatsAppNotificationService {
    private readonly apiKey: string;
    private readonly apiUrl: string;

    private cachedFromId: number | null = null;

    constructor() {
        this.apiKey = (process.env.WASAPI_API_KEY || '').trim();
        this.apiUrl = (process.env.WASAPI_URL || 'https://api-ws.wasapi.io/api/v1/whatsapp-messages').trim();
    }

    private async resolveFromId(): Promise<number | null> {
        if (this.cachedFromId) return this.cachedFromId;

        const fromIdEnv = (process.env.WASAPI_FROM_ID || '').trim();
        if (fromIdEnv && !isNaN(Number(fromIdEnv)) && fromIdEnv.length < 8) {
            this.cachedFromId = Number(fromIdEnv);
            return this.cachedFromId;
        }

        try {
            const res = await fetch('https://api-ws.wasapi.io/api/v1/whatsapp-numbers', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            if (res.ok) {
                const data = (await res.json()) as any;
                if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
                    this.cachedFromId = Number(data.data[0].id);
                    return this.cachedFromId;
                }
            }
        } catch (err: any) {
            console.warn('[Wasapi] No se pudo autodetectar la línea en /whatsapp-numbers:', err.message);
        }

        return null;
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

        if (!this.apiKey || this.apiKey === 'PENDIENTE' || this.apiKey === 'tu_api_key_aqui' || this.apiKey === 'tu_token_aqui') {
            console.log(`[Wasapi] ℹ️ MODO SIMULACIÓN (WASAPI_API_KEY no configurada aún):`);
            console.log(`[Wasapi] -> Destinatario: +${normalizedPhone} (${params.receiverName})`);
            console.log(`[Wasapi] -> Enlace: ${params.magicLinkUrl}`);
            return {
                success: true,
                messageId: `simulated-${Date.now()}`
            };
        }

        try {
            // Extraer el token de recepción para el botón interactivo de la plantilla
            const urlParts = params.magicLinkUrl.split('/');
            const token = urlParts[urlParts.length - 1] || 'token';

            const templateId = (process.env.WASAPI_TEMPLATE_ID || '7ccd82bc-84a5-4e17-a2db-ae089e9ace9a').trim();
            const headerImageUrl = (process.env.WASAPI_HEADER_IMAGE_URL || 'https://www.flotalamacarena.com/wp-content/uploads/2024/05/Logo_FlotaLaMacarena.png').trim();
            const fromId = await this.resolveFromId();

            const payload: Record<string, any> = {
                template_id: templateId,
                from_id: fromId || 3701,
                recipients: normalizedPhone,
                contact_type: 'phone',
                file: 'image',
                url_file: headerImageUrl,
                body_vars: [
                    { text: '{{1}}', val: params.receiverName },
                    { text: '{{2}}', val: params.consecutivo },
                    { text: '{{3}}', val: params.equiposSummary },
                    { text: '{{4}}', val: params.originLocation || 'Sede Origen' },
                    { text: '{{5}}', val: params.destinationLocation || 'Sede Destino' }
                ],
                cta_var: [
                    { text: '{{1}}', val: token }
                ]
            };

            const sendTemplateUrl = 'https://api-ws.wasapi.io/api/v1/whatsapp-messages/send-template';
            const response = await fetch(sendTemplateUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[Wasapi] Error HTTP ${response.status} al enviar plantilla a ${normalizedPhone}:`, errorBody);
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${errorBody}`
                };
            }

            const data = (await response.json().catch(() => ({}))) as any;
            const logEntry = Array.isArray(data?.logs) && data.logs.length > 0 ? data.logs[0] : null;
            const messageId = logEntry?.id?.toString() || logEntry?.wam_id || (data as any)?.id;

            if (data?.success && data?.sent > 0) {
                console.log(`[Wasapi] ✅ Plantilla oficial enviada con éxito a +${normalizedPhone} (ID: ${messageId || 'OK'})`);
                return {
                    success: true,
                    messageId
                };
            } else {
                const errorMsg = logEntry?.error || data?.error || 'No se pudo enviar la plantilla';
                console.warn(`[Wasapi] ⚠️ Envío no completado a +${normalizedPhone}:`, errorMsg);
                return {
                    success: false,
                    error: errorMsg
                };
            }
        } catch (error: any) {
            console.error(`[Wasapi] Excepción al enviar mensaje a ${normalizedPhone}:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
