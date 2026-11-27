import { ActivoTelemetryLog } from '../entities/ActivoTelemetryLog';

export interface TelemetrySettings {
    toleranceKm: number;
    cooldownHours: number;
    alertsEnabled: boolean;
    whatsappEnabled?: boolean;
    whatsappNotifyCustodian?: boolean;
    whatsappCargoIds?: string[];
    hasAdminPassword?: boolean;
    adminPassword?: string; // Usado únicamente en mutaciones de entrada (nunca expuesto en GET)
    updatedAt?: Date;
}

export interface IActivoTelemetryRepository {
    save(log: ActivoTelemetryLog): Promise<ActivoTelemetryLog>;
    findById?(id: string): Promise<ActivoTelemetryLog | null>;
    findLatestByActivoId(activoId: string): Promise<ActivoTelemetryLog | null>;
    findHistoryByActivoId(activoId: string, limit?: number): Promise<ActivoTelemetryLog[]>;
    findLatestForAllActivos(): Promise<ActivoTelemetryLog[]>;
    findRecentControversies(limit?: number): Promise<ActivoTelemetryLog[]>;
    resolveOpenControversiesByActivoId?(
        activoId: string,
        resolution: {
            status: 'RESUELTA' | 'DESCARTADA';
            type: string;
            notes: string;
            resolvedBy: string;
        }
    ): Promise<number>;
    getSettings(): Promise<TelemetrySettings>;
    getAdminPasswordHash(): Promise<string | null>;
    updateSettings(settings: Partial<TelemetrySettings>): Promise<TelemetrySettings>;
}
