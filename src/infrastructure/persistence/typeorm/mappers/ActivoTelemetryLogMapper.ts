import { ActivoTelemetryLog, TelemetryStatus } from '../../../../domain/entities/ActivoTelemetryLog';
import { ActivoTelemetryLogEntity } from '../entities/ActivoTelemetryLogEntity';

export class ActivoTelemetryLogMapper {
    public static toDomain(entity: ActivoTelemetryLogEntity): ActivoTelemetryLog {
        return new ActivoTelemetryLog({
            id: entity.id,
            activoId: entity.activoId,
            placa: entity.placa,
            reportedCoords: entity.reportedCoords,
            reportedIp: entity.reportedIp,
            expectedLocationId: entity.expectedLocationId,
            expectedLocationName: entity.expectedLocationName,
            detectedLocationId: entity.detectedLocationId,
            detectedLocationName: entity.detectedLocationName,
            distanceKm: entity.distanceKm !== null && entity.distanceKm !== undefined ? Number(entity.distanceKm) : null,
            status: entity.status as TelemetryStatus,
            alertSent: entity.alertSent,
            notificationUuid: entity.notificationUuid,
            observaciones: entity.observaciones,
            reportedAt: entity.reportedAt
        });
    }

    public static toPersistence(domain: ActivoTelemetryLog): ActivoTelemetryLogEntity {
        const entity = new ActivoTelemetryLogEntity();
        entity.id = domain.id;
        entity.activoId = domain.activoId;
        entity.placa = domain.placa;
        entity.reportedCoords = domain.reportedCoords;
        entity.reportedIp = domain.reportedIp;
        entity.expectedLocationId = domain.expectedLocationId;
        entity.expectedLocationName = domain.expectedLocationName;
        entity.detectedLocationId = domain.detectedLocationId;
        entity.detectedLocationName = domain.detectedLocationName;
        entity.distanceKm = domain.distanceKm;
        entity.status = domain.status;
        entity.alertSent = domain.alertSent;
        entity.notificationUuid = domain.notificationUuid;
        entity.observaciones = domain.observaciones;
        entity.reportedAt = domain.reportedAt;
        return entity;
    }
}

