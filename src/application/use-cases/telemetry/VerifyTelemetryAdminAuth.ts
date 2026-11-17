import { IActivoTelemetryRepository } from '../../../domain/repositories/IActivoTelemetryRepository';
import { PasswordHasher } from '../../../infrastructure/security/PasswordHasher';

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

        let expectedPasswordHash = process.env.TELEMETRY_ADMIN_PASSWORD || 'FLM#Admin2026';
        if (this.telemetryRepo) {
            try {
                const hash = await this.telemetryRepo.getAdminPasswordHash();
                if (hash) {
                    expectedPasswordHash = hash;
                }
            } catch {
                // Fallback a variable de entorno si la BD aún no tiene la columna o falla la consulta
            }
        }

        const isAuthorized = PasswordHasher.verify(password.trim(), expectedPasswordHash);

        if (isAuthorized) {
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
