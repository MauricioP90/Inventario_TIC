import { IDomainEvent } from './IDomainEvent';
import { ActivoTelemetryLog } from '../entities/ActivoTelemetryLog';

export class UnauthorizedLocationDetectedDomainEvent implements IDomainEvent {
    public readonly eventName = 'UnauthorizedLocationDetected';
    public readonly occurredOn: Date;

    constructor(
        public readonly telemetryLog: ActivoTelemetryLog,
        public readonly activoDetails: {
            id: string;
            placa: string;
            serial: string;
            marca: string;
            modelo: string;
            tipoNombre: string;
            responsibleName: string;
            responsibleEmail?: string;
            responsiblePhone?: string;
            expectedLocationName: string;
            expectedLocationCoords?: string | null;
            detectedLocationName: string;
            reportedCoords: string;
            reportedIp?: string | null;
            distanceKm: number;
        }
    ) {
        this.occurredOn = new Date();
    }
}

