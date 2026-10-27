import { IDomainEvent } from "./IDomainEvent";
import { Movement } from "../entities/Movement";

export interface AssetDetailPayload {
    placa: string;
    marca: string;
    modelo: string;
    serial: string;
}

export class MovementDispatchedDomainEvent implements IDomainEvent {
    readonly occurredOn: Date;
    readonly eventName: string = 'MovementDispatched';

    constructor(
        public readonly movement: Movement,
        public readonly assetsDetails: AssetDetailPayload[],
        public readonly recipients?: string[],
        public readonly notifyWhatsApp: boolean = true
    ) {
        this.occurredOn = new Date();
    }
}
