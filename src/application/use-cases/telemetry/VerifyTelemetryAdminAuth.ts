import { IActivoTelemetryRepository } from '../../../domain/repositories/IActivoTelemetryRepository';

export interface VerifyTelemetryAdminAuthInput {
    password?: string;
    placa?: string;
}

export interface VerifyTelemetryAdminAuthResult {
    authorized: boolean;
    message: string;
}

export class VerifyTelemetryAdminAuth {
    constructor(private readonly telemetryRepo?: IActivoTelemetryRepository) {}

    async execute(input: VerifyTelemetryAdminAuthInput): Promise<VerifyTelemetryAdminAuthResult> {
        const { password } = input;

        if (!password || typeof password !== 'string' || password.trim() === '') {
            throw new Error('El campo password es requerido.');
        }

        let expectedPassword = process.env.TELEMETRY_ADMIN_PASSWORD || 'FLM#Admin2026';
        if (this.telemetryRepo) {
            try {
                const settings = await this.telemetryRepo.getSettings();
                if (settings && settings.adminPassword) {
                    expectedPassword = settings.adminPassword;
                }
            } catch {
                // Fallback a variable de entorno si la BD aún no tiene la columna
            }
        }

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
