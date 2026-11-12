export interface VerifyTelemetryAdminAuthInput {
    password?: string;
    placa?: string;
}

export interface VerifyTelemetryAdminAuthResult {
    authorized: boolean;
    message: string;
}

export class VerifyTelemetryAdminAuth {
    constructor() {}

    async execute(input: VerifyTelemetryAdminAuthInput): Promise<VerifyTelemetryAdminAuthResult> {
        const { password } = input;

        if (!password || typeof password !== 'string' || password.trim() === '') {
            throw new Error('El campo password es requerido.');
        }

        const expectedPassword = process.env.TELEMETRY_ADMIN_PASSWORD || 'FLM#Admin2026';

        if (password === expectedPassword) {
            return {
                authorized: true,
                message: 'Autenticación administrativa autorizada.'
            };
        }

        return {
            authorized: false,
            message: 'Credencial administrativa inválida.'
        };
    }
}
