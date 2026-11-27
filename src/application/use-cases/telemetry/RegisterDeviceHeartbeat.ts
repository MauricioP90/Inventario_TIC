import { ActivoTelemetryLog, TelemetryStatus } from '../../../domain/entities/ActivoTelemetryLog';
import { EstadoActivo } from '../../../domain/entities/Activo';
import { MovementStatus } from '../../../domain/entities/Movement';
import { Coordinates } from '../../../domain/value-objects/Coordinates';
import { IActivoRepository } from '../../../domain/repositories/IActivoRepository';
import { ILocationRepository } from '../../../domain/repositories/ILocationRepository';
import { IMovementRepository } from '../../../domain/repositories/IMovementRepository';
import { IActivoTelemetryRepository } from '../../../domain/repositories/IActivoTelemetryRepository';
import { IEventBus } from '../../../domain/events/IEventBus';
import { UnauthorizedLocationDetectedDomainEvent } from '../../../domain/events/UnauthorizedLocationDetectedDomainEvent';

export interface RegisterDeviceHeartbeatInput {
    placa: string;
    latitud?: number | null;
    longitud?: number | null;
    ipAddress?: string | null;
    toleranceKm?: number;
    forceAlert?: boolean;
    isMock?: boolean;
    tamperingAlert?: string | null;
}

export class RegisterDeviceHeartbeat {
    constructor(
        private readonly activoRepository: IActivoRepository,
        private readonly locationRepository: ILocationRepository,
        private readonly movementRepository: IMovementRepository,
        private readonly telemetryRepository: IActivoTelemetryRepository,
        private readonly eventBus?: IEventBus
    ) {}

    async execute(input: RegisterDeviceHeartbeatInput): Promise<ActivoTelemetryLog> {
        if (!input.placa || !input.placa.trim()) {
            throw new Error('La placa del activo es obligatoria.');
        }

        const normalizedPlaca = input.placa.trim().toUpperCase();
        const activo = await this.activoRepository.findByPlaca(normalizedPlaca);
        if (!activo) {
            throw new Error(`No existe ningún activo registrado con la placa ${normalizedPlaca}`);
        }

        // Validar que el Tipo de Activo admita telemetría automatizada (o software como fallback)
        if (!activo.tipoActivo?.admiteTelemetria && !activo.tipoActivo?.admiteSoftware) {
            throw new Error(
                `El activo [${normalizedPlaca}] es de tipo '${activo.tipoActivo?.nombre || 'Sin tipo'}', el cual tiene deshabilitado el monitoreo de telemetría GPS.`
            );
        }

        const rawTampering = input.tamperingAlert?.trim();
        const tamperingType: string | null = rawTampering
            ? rawTampering.toUpperCase()
            : input.isMock
            ? 'MOCK_LOCATION_DETECTED'
            : null;
        const isTampered = Boolean(tamperingType);

        const settings = await this.telemetryRepository.getSettings();
        const rawLat =
            input.latitud !== undefined && input.latitud !== null ? Number(input.latitud) : isTampered ? 0 : NaN;
        const rawLon =
            input.longitud !== undefined && input.longitud !== null ? Number(input.longitud) : isTampered ? 0 : NaN;
        const reportedCoords = Coordinates.create(rawLat, rawLon);
        const toleranceKm = input.toleranceKm ?? settings.toleranceKm;

        // 1. Identificar la sede oficial asignada al activo
        const expectedLocation = activo.location;
        const expectedLocationId = expectedLocation?.id || null;
        const expectedLocationName = expectedLocation?.nombre || 'Sin sede asignada';

        // 2. Identificar cuál sede registrada en la empresa está más cerca de las coordenadas reportadas
        const allLocations = await this.locationRepository.findAll();
        let closestLocationId: string | null = null;
        let closestLocationName = `Coordenada Externa (${reportedCoords.toString()})`;
        let minDistanceToAnyLocation = Infinity;

        for (const loc of allLocations) {
            if (!loc.coordenadas) continue;
            try {
                const locCoords = Coordinates.fromString(loc.coordenadas);
                const dist = reportedCoords.distanceInKmTo(locCoords);
                if (dist < minDistanceToAnyLocation) {
                    minDistanceToAnyLocation = dist;
                    if (dist <= 2.5) {
                        closestLocationId = loc.id || null;
                        closestLocationName = `${loc.nombre}${loc.ciudad ? ` (${loc.ciudad})` : ''}`;
                    } else {
                        closestLocationName = `Fuera de sede (a ${dist} km de ${loc.nombre})`;
                    }
                }
            } catch {
                // Ignorar sedes con coordenadas mal formateadas
            }
        }

        // 3. Evaluar Geocerca contra la sede oficial esperada
        let distanceKm: number | null = null;
        let status: TelemetryStatus = 'SIN_COORDENADAS_SEDE';
        let observaciones = 'La sede asignada al activo no posee coordenadas GPS configuradas.';

        if (expectedLocation?.coordenadas) {
            try {
                const expectedCoords = Coordinates.fromString(expectedLocation.coordenadas);
                distanceKm = reportedCoords.distanceInKmTo(expectedCoords);

                if (distanceKm <= toleranceKm) {
                    status = 'CONFORME';
                    observaciones = `Dispositivo verificado dentro del perímetro autorizado de ${expectedLocationName} (${distanceKm} km).`;
                } else {
                    // Fuera del perímetro: revisar si existe traslado activo (IN_TRANSIT / PENDING) o mantenimiento
                    const allMovements = await this.movementRepository.findAll();
                    const activeMovement = allMovements.find(
                        m =>
                            (m.status === MovementStatus.EN_TRANSIT ||
                                (m.status as string) === 'IN_TRANSIT' ||
                                m.status === MovementStatus.PENDING) &&
                            m.activoIds.includes(activo.id!)
                    );

                    if (activeMovement) {
                        status = 'EN_TRANSITO_AUTORIZADO';
                        observaciones = `Activo fuera de sede origen (${distanceKm} km), pero amparado por traslado autorizado #${(activeMovement.id || '').slice(0, 8).toUpperCase()}.`;
                    } else if (activo.estado === EstadoActivo.MANTENIMIENTO) {
                        status = 'EN_TRANSITO_AUTORIZADO';
                        observaciones = `Activo fuera de sede (${distanceKm} km), amparado por estado MANTENIMIENTO.`;
                    } else {
                        status = 'CONTROVERSIA_UBICACION';
                        observaciones = `Desviación no autorizada de ${distanceKm} km respecto a ${expectedLocationName}. Detectado en: ${closestLocationName}.`;
                    }
                }
            } catch {
                status = 'SIN_COORDENADAS_SEDE';
                observaciones = `Las coordenadas de la sede ${expectedLocationName} tienen un formato inválido.`;
            }
        }

        // 3.1 Evaluación prioritaria de Detección Activa de Sabotaje (Anti-Tampering / Mock GPS)
        if (isTampered && tamperingType) {
            status = 'CONTROVERSIA_UBICACION';
            const motivoLabel =
                tamperingType === 'PERMISOS_UBICACION_REVOCADOS'
                    ? 'PERMISOS DE UBICACIÓN REVOCADOS'
                    : tamperingType === 'GPS_DESACTIVADO'
                    ? 'SENSOR GPS DESACTIVADO'
                    : tamperingType === 'MOCK_LOCATION_DETECTED'
                    ? 'UBICACIÓN SIMULADA (MOCK GPS)'
                    : tamperingType;

            observaciones = `🚨 ALERTA DE SEGURIDAD (ANTI-SABOTAJE): ${motivoLabel} [${tamperingType}] reportado por el dispositivo. IP: ${input.ipAddress || 'Desconocida'}.`;
        }

        // 4. Control Anti-Spam (Cooldown configurable desde el centro de telemetría)
        let shouldSendAlert = status === 'CONTROVERSIA_UBICACION' && (settings.alertsEnabled || Boolean(input.forceAlert) || isTampered);
        if (shouldSendAlert && settings.cooldownHours > 0 && !input.forceAlert) {
            const previousLog = await this.telemetryRepository.findLatestByActivoId(activo.id!);
            if (
                previousLog &&
                previousLog.status === 'CONTROVERSIA_UBICACION' &&
                previousLog.alertSent
            ) {
                const hoursSinceLast =
                    (Date.now() - new Date(previousLog.reportedAt).getTime()) / (1000 * 60 * 60);
                if (hoursSinceLast < settings.cooldownHours) {
                    if (isTampered) {
                        if (tamperingType && previousLog.observaciones?.includes(tamperingType)) {
                            shouldSendAlert = false;
                            observaciones += ` (Alerta anti-sabotaje omitida por ventana anti-spam de ${settings.cooldownHours}h).`;
                        }
                    } else {
                        try {
                            const prevCoords = Coordinates.fromString(previousLog.reportedCoords);
                            if (reportedCoords.distanceInKmTo(prevCoords) <= 1.0) {
                                shouldSendAlert = false;
                                observaciones += ` (Alerta omitida por ventana anti-spam de ${settings.cooldownHours}h).`;
                            }
                        } catch {
                            // Continuar con envío normal
                        }
                    }
                }
            }
        }

        const log = new ActivoTelemetryLog({
            activoId: activo.id!,
            placa: activo.placa,
            reportedCoords: reportedCoords.toString(),
            reportedIp: input.ipAddress ?? null,
            expectedLocationId,
            expectedLocationName,
            detectedLocationId: closestLocationId,
            detectedLocationName: closestLocationName,
            distanceKm,
            status,
            alertSent: shouldSendAlert,
            observaciones
        });

        const savedLog = await this.telemetryRepository.save(log);

        // 4.1 Auto-normalización: si el equipo vuelve a reportar CONFORME dentro de su geocerca oficial,
        // cerrar automáticamente las controversias pendientes previas de ese activo para mantener limpia la bandeja.
        if (status === 'CONFORME' && this.telemetryRepository.resolveOpenControversiesByActivoId) {
            await this.telemetryRepository.resolveOpenControversiesByActivoId(activo.id!, {
                status: 'RESUELTA',
                type: 'AUTO_NORMALIZADA',
                notes: `Normalizada automáticamente al verificar encendido CONFORME en ${expectedLocationName}.`,
                resolvedBy: 'Sistema (Telemetría GPS)'
            });
        }

        // 5. Publicar Evento de Dominio si aplica alerta por controversia o sabotaje
        if (shouldSendAlert && this.eventBus && (distanceKm !== null || isTampered)) {
            await this.eventBus.publish(
                new UnauthorizedLocationDetectedDomainEvent(savedLog, {
                    id: activo.id!,
                    placa: activo.placa,
                    serial: activo.serial,
                    marca: activo.marca,
                    modelo: activo.modelo,
                    tipoNombre: activo.tipoActivo?.nombre || 'Equipo',
                    responsibleName: activo.responsible?.nombre || 'Sin custodio asignado',
                    responsibleEmail: activo.responsible?.email,
                    responsiblePhone: activo.responsible?.telefono,
                    expectedLocationName,
                    expectedLocationCoords: expectedLocation?.coordenadas || null,
                    detectedLocationName: closestLocationName,
                    reportedCoords: reportedCoords.toString(),
                    reportedIp: input.ipAddress ?? null,
                    distanceKm: distanceKm ?? 0,
                    tamperingType
                })
            );
        }

        return savedLog;
    }
}
