import { ActivoTelemetryLog, ControversyResolutionType } from '../../../domain/entities/ActivoTelemetryLog';
import { IActivoTelemetryRepository } from '../../../domain/repositories/IActivoTelemetryRepository';

export interface ResolveTelemetryControversyInput {
    logId: string;
    resolutionStatus?: 'RESUELTA' | 'DESCARTADA';
    resolutionType: ControversyResolutionType;
    resolutionNotes: string;
    resolvedBy: string;
    applyToAllOpenForActivo?: boolean;
}

export interface ResolveTelemetryControversyResult {
    resolvedLog: ActivoTelemetryLog;
    additionalClosedCount: number;
}

export class ResolveTelemetryControversy {
    constructor(private readonly telemetryRepository: IActivoTelemetryRepository) {}

    async execute(input: ResolveTelemetryControversyInput): Promise<ResolveTelemetryControversyResult> {
        if (!this.telemetryRepository.findById) {
            throw new Error('El repositorio de telemetría no soporta consulta individual por ID.');
        }

        const log = await this.telemetryRepository.findById(input.logId);
        if (!log) {
            throw new Error('Registro de controversia no encontrado.');
        }

        const targetStatus = input.resolutionStatus || 'RESUELTA';
        log.resolveControversy({
            status: targetStatus,
            type: input.resolutionType,
            notes: input.resolutionNotes,
            resolvedBy: input.resolvedBy
        });

        const saved = await this.telemetryRepository.save(log);

        let additionalClosedCount = 0;
        if (input.applyToAllOpenForActivo !== false && this.telemetryRepository.resolveOpenControversiesByActivoId) {
            additionalClosedCount = await this.telemetryRepository.resolveOpenControversiesByActivoId(
                log.activoId,
                {
                    status: targetStatus,
                    type: input.resolutionType,
                    notes: log.resolutionNotes || input.resolutionNotes,
                    resolvedBy: log.resolvedBy || input.resolvedBy
                }
            );
        }

        return {
            resolvedLog: saved,
            additionalClosedCount
        };
    }
}
