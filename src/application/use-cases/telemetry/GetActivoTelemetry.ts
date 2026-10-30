import { ActivoTelemetryLog } from '../../../domain/entities/ActivoTelemetryLog';
import { IActivoTelemetryRepository, TelemetrySettings } from '../../../domain/repositories/IActivoTelemetryRepository';

export class GetActivoTelemetry {
    constructor(private readonly telemetryRepository: IActivoTelemetryRepository) {}

    async getHistoryByActivo(activoId: string, limit: number = 15): Promise<ActivoTelemetryLog[]> {
        return await this.telemetryRepository.findHistoryByActivoId(activoId, limit);
    }

    async getOverview(): Promise<{
        settings: TelemetrySettings;
        latestByActivo: Record<string, ReturnType<ActivoTelemetryLog['toJSON']>>;
        recentControversies: ReturnType<ActivoTelemetryLog['toJSON']>[];
    }> {
        const [settings, latestList, controversies] = await Promise.all([
            this.telemetryRepository.getSettings(),
            this.telemetryRepository.findLatestForAllActivos(),
            this.telemetryRepository.findRecentControversies(25)
        ]);

        const latestByActivo: Record<string, ReturnType<ActivoTelemetryLog['toJSON']>> = {};
        for (const item of latestList) {
            latestByActivo[item.activoId] = item.toJSON();
        }

        return {
            settings,
            latestByActivo,
            recentControversies: controversies.map(c => c.toJSON())
        };
    }

    async getSettings(): Promise<TelemetrySettings> {
        return await this.telemetryRepository.getSettings();
    }

    async updateSettings(settings: Partial<TelemetrySettings>): Promise<TelemetrySettings> {
        return await this.telemetryRepository.updateSettings(settings);
    }
}

