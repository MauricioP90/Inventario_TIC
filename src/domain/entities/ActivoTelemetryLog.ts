import { randomUUID } from 'node:crypto';

export type TelemetryStatus =
    | 'CONFORME'
    | 'EN_TRANSITO_AUTORIZADO'
    | 'CONTROVERSIA_UBICACION'
    | 'SIN_COORDENADAS_SEDE';

export type ControversyResolutionStatus = 'PENDIENTE' | 'RESUELTA' | 'DESCARTADA';

export type ControversyResolutionType =
    | 'TRASLADO_REGULARIZADO'
    | 'COORDENADA_SEDE_AJUSTADA'
    | 'FALSO_POSITIVO_GPS'
    | 'SABOTAJE_ATENDIDO'
    | 'MANTENIMIENTO_REGISTRADO'
    | 'AUTO_NORMALIZADA'
    | 'OTRO';

export interface ActivoTelemetryLogProps {
    id?: string;
    activoId: string;
    placa: string;
    reportedCoords: string;
    reportedIp?: string | null;
    expectedLocationId?: string | null;
    expectedLocationName?: string | null;
    detectedLocationId?: string | null;
    detectedLocationName?: string | null;
    distanceKm?: number | null;
    status: TelemetryStatus;
    alertSent?: boolean;
    notificationUuid?: string | null;
    observaciones?: string | null;
    reportedAt?: Date;
    resolutionStatus?: ControversyResolutionStatus | null;
    resolutionType?: ControversyResolutionType | null;
    resolutionNotes?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: Date | null;
}

export class ActivoTelemetryLog {
    private props: ActivoTelemetryLogProps;

    constructor(props: ActivoTelemetryLogProps) {
        if (!props.activoId) {
            throw new Error('El ID del activo es obligatorio en el reporte de telemetría.');
        }
        if (!props.placa) {
            throw new Error('La placa del activo es obligatoria en el reporte de telemetría.');
        }
        if (!props.reportedCoords) {
            throw new Error('Las coordenadas reportadas son obligatorias.');
        }

        const defaultResolutionStatus: ControversyResolutionStatus | null =
            props.resolutionStatus !== undefined
                ? props.resolutionStatus
                : props.status === 'CONTROVERSIA_UBICACION'
                ? 'PENDIENTE'
                : null;

        this.props = {
            ...props,
            id: props.id || randomUUID(),
            placa: props.placa.trim().toUpperCase(),
            reportedCoords: props.reportedCoords.trim(),
            reportedIp: props.reportedIp ?? null,
            expectedLocationId: props.expectedLocationId ?? null,
            expectedLocationName: props.expectedLocationName ?? null,
            detectedLocationId: props.detectedLocationId ?? null,
            detectedLocationName: props.detectedLocationName ?? null,
            distanceKm: props.distanceKm !== undefined ? props.distanceKm : null,
            alertSent: props.alertSent ?? false,
            notificationUuid: props.notificationUuid ?? null,
            observaciones: props.observaciones ?? null,
            reportedAt: props.reportedAt || new Date(),
            resolutionStatus: defaultResolutionStatus,
            resolutionType: props.resolutionType ?? null,
            resolutionNotes: props.resolutionNotes ?? null,
            resolvedBy: props.resolvedBy ?? null,
            resolvedAt: props.resolvedAt ?? null
        };
    }

    get id(): string { return this.props.id!; }
    get activoId(): string { return this.props.activoId; }
    get placa(): string { return this.props.placa; }
    get reportedCoords(): string { return this.props.reportedCoords; }
    get reportedIp(): string | null { return this.props.reportedIp ?? null; }
    get expectedLocationId(): string | null { return this.props.expectedLocationId ?? null; }
    get expectedLocationName(): string | null { return this.props.expectedLocationName ?? null; }
    get detectedLocationId(): string | null { return this.props.detectedLocationId ?? null; }
    get detectedLocationName(): string | null { return this.props.detectedLocationName ?? null; }
    get distanceKm(): number | null { return this.props.distanceKm ?? null; }
    get status(): TelemetryStatus { return this.props.status; }
    get alertSent(): boolean { return this.props.alertSent ?? false; }
    get notificationUuid(): string | null { return this.props.notificationUuid ?? null; }
    get observaciones(): string | null { return this.props.observaciones ?? null; }
    get reportedAt(): Date { return this.props.reportedAt!; }
    get resolutionStatus(): ControversyResolutionStatus | null { return this.props.resolutionStatus ?? null; }
    get resolutionType(): ControversyResolutionType | null { return this.props.resolutionType ?? null; }
    get resolutionNotes(): string | null { return this.props.resolutionNotes ?? null; }
    get resolvedBy(): string | null { return this.props.resolvedBy ?? null; }
    get resolvedAt(): Date | null { return this.props.resolvedAt ?? null; }

    public markAlertSent(notificationUuid?: string | null): void {
        this.props.alertSent = true;
        if (notificationUuid) {
            this.props.notificationUuid = notificationUuid;
        }
    }

    public resolveControversy(input: {
        status: 'RESUELTA' | 'DESCARTADA';
        type: ControversyResolutionType;
        notes: string;
        resolvedBy: string;
    }): void {
        if (this.props.status !== 'CONTROVERSIA_UBICACION') {
            throw new Error('Solo los registros en estado CONTROVERSIA_UBICACION pueden ser resueltos.');
        }
        const trimmedNotes = (input.notes || '').trim();
        if (trimmedNotes.length < 5) {
            throw new Error('Debe ingresar una justificación detallada (mínimo 5 caracteres) para cerrar la controversia.');
        }
        this.props.resolutionStatus = input.status;
        this.props.resolutionType = input.type;
        this.props.resolutionNotes = trimmedNotes;
        this.props.resolvedBy = (input.resolvedBy || 'Administrador').trim();
        this.props.resolvedAt = new Date();
    }

    public toJSON() {
        return {
            id: this.id,
            activoId: this.activoId,
            placa: this.placa,
            reportedCoords: this.reportedCoords,
            reportedIp: this.reportedIp,
            expectedLocationId: this.expectedLocationId,
            expectedLocationName: this.expectedLocationName,
            detectedLocationId: this.detectedLocationId,
            detectedLocationName: this.detectedLocationName,
            distanceKm: this.distanceKm,
            status: this.status,
            alertSent: this.alertSent,
            notificationUuid: this.notificationUuid,
            observaciones: this.observaciones,
            reportedAt: this.reportedAt,
            resolutionStatus: this.resolutionStatus,
            resolutionType: this.resolutionType,
            resolutionNotes: this.resolutionNotes,
            resolvedBy: this.resolvedBy,
            resolvedAt: this.resolvedAt
        };
    }
}
