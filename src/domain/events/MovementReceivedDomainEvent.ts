import { IDomainEvent } from "./IDomainEvent";
import { Movement } from "../entities/Movement";
import { AssetDetailPayload } from "./MovementDispatchedDomainEvent";

export class MovementReceivedDomainEvent implements IDomainEvent {
    readonly occurredOn: Date;
    readonly eventName: string = 'MovementReceived';

    constructor(
        public readonly movement: Movement,
        public readonly receiverId: string,
        public readonly receiverEvidenceUrl?: string,
        public readonly assetsDetails: AssetDetailPayload[] = []
    ) {
        this.occurredOn = new Date();
    }
}
