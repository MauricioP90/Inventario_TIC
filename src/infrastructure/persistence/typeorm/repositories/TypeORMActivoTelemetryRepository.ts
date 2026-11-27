import { Repository } from 'typeorm';
import { ActivoTelemetryLog } from '../../../../domain/entities/ActivoTelemetryLog';
import { IActivoTelemetryRepository, TelemetrySettings } from '../../../../domain/repositories/IActivoTelemetryRepository';
import { ActivoTelemetryLogEntity } from '../entities/ActivoTelemetryLogEntity';
import { ActivoTelemetryLogMapper } from '../mappers/ActivoTelemetryLogMapper';
import { PasswordHasher } from '../../../security/PasswordHasher';

export class TypeORMActivoTelemetryRepository implements IActivoTelemetryRepository {
    constructor(private readonly ormRepo: Repository<ActivoTelemetryLogEntity>) {}

    async save(log: ActivoTelemetryLog): Promise<ActivoTelemetryLog> {
        const entity = ActivoTelemetryLogMapper.toPersistence(log);
        const saved = await this.ormRepo.save(entity);
        return ActivoTelemetryLogMapper.toDomain(saved);
    }

    async findById(id: string): Promise<ActivoTelemetryLog | null> {
        const entity = await this.ormRepo.findOne({ where: { id } });
        return entity ? ActivoTelemetryLogMapper.toDomain(entity) : null;
    }

    async findLatestByActivoId(activoId: string): Promise<ActivoTelemetryLog | null> {
        const entity = await this.ormRepo.findOne({
            where: { activoId },
            order: { reportedAt: 'DESC' }
        });
        return entity ? ActivoTelemetryLogMapper.toDomain(entity) : null;
    }

    async findHistoryByActivoId(activoId: string, limit: number = 15): Promise<ActivoTelemetryLog[]> {
        const entities = await this.ormRepo.find({
            where: { activoId },
            order: { reportedAt: 'DESC' },
            take: limit
        });
        return entities.map(e => ActivoTelemetryLogMapper.toDomain(e));
    }

    async findLatestForAllActivos(): Promise<ActivoTelemetryLog[]> {
        const entities = await this.ormRepo
            .createQueryBuilder('t')
            .distinctOn(['t.activo_id'])
            .orderBy('t.activo_id', 'ASC')
            .addOrderBy('t.reported_at', 'DESC')
            .getMany();

        return entities.map(e => ActivoTelemetryLogMapper.toDomain(e));
    }

    async findRecentControversies(limit: number = 25): Promise<ActivoTelemetryLog[]> {
        const entities = await this.ormRepo.find({
            where: { status: 'CONTROVERSIA_UBICACION' },
            order: { reportedAt: 'DESC' },
            take: limit
        });
        return entities.map(e => ActivoTelemetryLogMapper.toDomain(e));
    }

    async resolveOpenControversiesByActivoId(
        activoId: string,
        resolution: {
            status: 'RESUELTA' | 'DESCARTADA';
            type: string;
            notes: string;
            resolvedBy: string;
        }
    ): Promise<number> {
        const result = await this.ormRepo
            .createQueryBuilder()
            .update(ActivoTelemetryLogEntity)
            .set({
                resolutionStatus: resolution.status,
                resolutionType: resolution.type,
                resolutionNotes: resolution.notes,
                resolvedBy: resolution.resolvedBy,
                resolvedAt: new Date()
            })
            .where('activo_id = :activoId', { activoId })
            .andWhere('status = :status', { status: 'CONTROVERSIA_UBICACION' })
            .andWhere('(resolution_status IS NULL OR resolution_status = :pending)', { pending: 'PENDIENTE' })
            .execute();

        return result.affected || 0;
    }

    async getAdminPasswordHash(): Promise<string | null> {
        try {
            const rows = await this.ormRepo.manager.query(
                `SELECT admin_password FROM telemetry_settings WHERE id = 'default' LIMIT 1`
            );
            if (rows && rows.length > 0 && rows[0].admin_password) {
                return rows[0].admin_password;
            }
        } catch {
            // Silencioso si la columna o tabla aún no existen
        }
        return process.env.TELEMETRY_ADMIN_PASSWORD || 'FLM#Admin2026';
    }

    async getSettings(): Promise<TelemetrySettings> {
        try {
            const rows = await this.ormRepo.manager.query(
                `SELECT tolerance_km, cooldown_hours, alerts_enabled, whatsapp_enabled, whatsapp_notify_custodian, whatsapp_cargo_ids, admin_password, updated_at FROM telemetry_settings WHERE id = 'default' LIMIT 1`
            );
            if (rows && rows.length > 0) {
                let cargoIds: string[] = [];
                try {
                    if (Array.isArray(rows[0].whatsapp_cargo_ids)) {
                        cargoIds = rows[0].whatsapp_cargo_ids;
                    } else if (typeof rows[0].whatsapp_cargo_ids === 'string') {
                        cargoIds = JSON.parse(rows[0].whatsapp_cargo_ids);
                    }
                } catch {
                    cargoIds = [];
                }

                return {
                    toleranceKm: Number(rows[0].tolerance_km),
                    cooldownHours: Number(rows[0].cooldown_hours),
                    alertsEnabled: Boolean(rows[0].alerts_enabled),
                    whatsappEnabled: rows[0].whatsapp_enabled !== undefined ? Boolean(rows[0].whatsapp_enabled) : true,
                    whatsappNotifyCustodian: rows[0].whatsapp_notify_custodian !== undefined ? Boolean(rows[0].whatsapp_notify_custodian) : true,
                    whatsappCargoIds: cargoIds,
                    hasAdminPassword: Boolean(rows[0].admin_password || process.env.TELEMETRY_ADMIN_PASSWORD),
                    // adminPassword se omite intencionalmente para no exponer hashes ni claves al navegador
                    updatedAt: rows[0].updated_at
                };
            }
        } catch {
            // Fallback a valores por defecto si la tabla o columnas aún no existen
        }
        return {
            toleranceKm: Number(process.env.TELEMETRY_TOLERANCE_KM) || 1.5,
            cooldownHours: 12,
            alertsEnabled: true,
            whatsappEnabled: true,
            whatsappNotifyCustodian: true,
            whatsappCargoIds: [],
            hasAdminPassword: true,
            updatedAt: new Date()
        };
    }

    async updateSettings(settings: Partial<TelemetrySettings>): Promise<TelemetrySettings> {
        const current = await this.getSettings();
        const toleranceKm = settings.toleranceKm !== undefined ? Math.max(0.1, Number(settings.toleranceKm)) : current.toleranceKm;
        const cooldownHours = settings.cooldownHours !== undefined ? Math.max(0, Number(settings.cooldownHours)) : current.cooldownHours;
        const alertsEnabled = settings.alertsEnabled !== undefined ? Boolean(settings.alertsEnabled) : current.alertsEnabled;
        const whatsappEnabled = settings.whatsappEnabled !== undefined ? Boolean(settings.whatsappEnabled) : (current.whatsappEnabled ?? true);
        const whatsappNotifyCustodian = settings.whatsappNotifyCustodian !== undefined ? Boolean(settings.whatsappNotifyCustodian) : (current.whatsappNotifyCustodian ?? true);
        const whatsappCargoIds = settings.whatsappCargoIds !== undefined ? settings.whatsappCargoIds : (current.whatsappCargoIds ?? []);

        // Obtener la clave actual para conservarla si el usuario no ingresó una nueva
        const currentStoredPassword = await this.getAdminPasswordHash();
        let targetPasswordHash = currentStoredPassword || PasswordHasher.hash(process.env.TELEMETRY_ADMIN_PASSWORD || 'FLM#Admin2026');

        if (settings.adminPassword && settings.adminPassword.trim() !== '') {
            const rawPassword = settings.adminPassword.trim();
            targetPasswordHash = PasswordHasher.isHashed(rawPassword) 
                ? rawPassword 
                : PasswordHasher.hash(rawPassword);
        }

        await this.ormRepo.manager.query(
            `INSERT INTO telemetry_settings (id, tolerance_km, cooldown_hours, alerts_enabled, whatsapp_enabled, whatsapp_notify_custodian, whatsapp_cargo_ids, admin_password, updated_at)
             VALUES ('default', $1, $2, $3, $4, $5, $6, $7, now())
             ON CONFLICT (id) DO UPDATE SET
               tolerance_km = EXCLUDED.tolerance_km,
               cooldown_hours = EXCLUDED.cooldown_hours,
               alerts_enabled = EXCLUDED.alerts_enabled,
               whatsapp_enabled = EXCLUDED.whatsapp_enabled,
               whatsapp_notify_custodian = EXCLUDED.whatsapp_notify_custodian,
               whatsapp_cargo_ids = EXCLUDED.whatsapp_cargo_ids,
               admin_password = EXCLUDED.admin_password,
               updated_at = now()`,
            [toleranceKm, cooldownHours, alertsEnabled, whatsappEnabled, whatsappNotifyCustodian, JSON.stringify(whatsappCargoIds), targetPasswordHash]
        );

        return await this.getSettings();
    }
}

