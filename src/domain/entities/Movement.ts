import { randomUUID } from 'node:crypto';

export enum MovementStatus {
    PENDING = 'PENDING',
    EN_TRANSIT = 'EN_TRANSIT',
    RECEIVED = 'RECEIVED',
    CANCELLED = 'CANCELLED'
}

export interface MovementProps {
    id?: string;
    type: string;
    originLocationId: string;
    destinationLocationId: string;
    responsibleId: string;
    status: MovementStatus;
    activoIds: string[];
    notes?: string;
    evidenceUrl?: string;
    createdAt?: Date;
    shippedAt?: Date;
    receivedAt?: Date;
}

export class Movement {
    private props: MovementProps;

    constructor(props: MovementProps) {
        this.props = {
            ...props,
            id: props.id || randomUUID(),
            status: props.status || MovementStatus.PENDING,
            createdAt: props.createdAt || new Date(),
            activoIds: props.activoIds || []
        };
        this.validar();
    }

    private validar() {
        if (!this.props.type) throw new Error('El tipo de movimiento es obligatorio');
        if (!this.props.originLocationId) throw new Error('La sede de origen es obligatoria');
        if (!this.props.destinationLocationId) throw new Error('La sede de destino es obligatoria');
        if (this.props.originLocationId === this.props.destinationLocationId) {
            throw new Error('La sede de origen y destino no pueden ser la misma');
        }
        if (!this.props.responsibleId) throw new Error('El responsable es obligatorio');
        if (!this.props.activoIds || this.props.activoIds.length === 0) {
            throw new Error('Debe haber al menos un activo en el movimiento');
        }
    }

    get id(): string | undefined { return this.props.id; }
    get type(): string { return this.props.type; }
    get originLocationId(): string { return this.props.originLocationId; }
    get destinationLocationId(): string { return this.props.destinationLocationId; }
    get responsibleId(): string { return this.props.responsibleId; }
    get status(): MovementStatus { return this.props.status; }
    get activoIds(): string[] { return this.props.activoIds; }
    get notes(): string | undefined { return this.props.notes; }
    get evidenceUrl(): string | undefined { return this.props.evidenceUrl; }
    get createdAt(): Date | undefined { return this.props.createdAt; }
    get shippedAt(): Date | undefined { return this.props.shippedAt; }
    get receivedAt(): Date | undefined { return this.props.receivedAt; }

    public dispatch() {
        if (this.props.status !== MovementStatus.PENDING) {
            throw new Error('Solo se pueden despachar movimientos pendientes');
        }
        this.props.status = MovementStatus.EN_TRANSIT;
        this.props.shippedAt = new Date();
    }

    public receive() {
        if (this.props.status !== MovementStatus.EN_TRANSIT) {
            throw new Error('Solo se pueden recibir movimientos que estén en tránsito');
        }
        this.props.status = MovementStatus.RECEIVED;
        this.props.receivedAt = new Date();
    }

    public cancel() {
        if (this.props.status === MovementStatus.RECEIVED) {
            throw new Error('No se puede cancelar un movimiento ya recibido');
        }
        this.props.status = MovementStatus.CANCELLED;
    }

    public toJSON() {
        return {
            ...this.props
        };
    }
}
