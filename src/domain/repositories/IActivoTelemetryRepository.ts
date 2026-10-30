import { ActivoTelemetryLog } from '../entities/ActivoTelemetryLog';

export interface TelemetrySettings {
    toleranceKm: number;
    cooldownHours: number;
    alertsEnabled: boolean;
    whatsappEnabled?: boolean;
    whatsappNotifyCustodian?: boolean;
    whatsappCargoIds?: string[];
    updatedAt?: Date;
}

export interface IActivoTelemetryRepository {
    save(log: ActivoTelemetryLog): Promise<ActivoTelemetryLog>;
    findLatestByActivoId(activoId: string): Promise<ActivoTelemetryLog | null>;
    findHistoryByActivoId(activoId: string, limit?: number): Promise<ActivoTelemetryLog[]>;
    findLatestForAllActivos(): Promise<ActivoTelemetryLog[]>;
    findRecentControversies(limit?: number): Promise<ActivoTelemetryLog[]>;
    getSettings(): Promise<TelemetrySettings>;
    updateSettings(settings: Partial<TelemetrySettings>): Promise<TelemetrySettings>;
}

