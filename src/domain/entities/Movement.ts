import { randomUUID } from 'node:crypto';

export enum MovementStatus {
    PENDING = 'PENDING',
    EN_TRANSIT = 'EN_TRANSIT',
    RECEIVED = 'RECEIVED',
    CANCELLED = 'CANCELLED'
}

export enum MovementType {
    // Activos
    REGIONAL_TRANSFER = 'TRASLADO_REGIONAL',
    OFFICE_ASSIGNMENT = 'ASIGNACION_OFICINA',
    LOAN_OUT = 'SALIDA_PRESTAMO',
    SUPPORT_RETURN = 'RETORNO_SOPORTE',
    PROVIDER_WARRANTY = 'ENVIO_GARANTIA',
    SUPPORT_REENTRY = 'REINGRESO_SOPORTE',
    DISPOSAL = 'BAJA_ACTIVO',
    // SIM Cards
    SIM_ASSIGNMENT = 'SIM_ASIGNACION',
    SIM_CHANGE = 'SIM_CAMBIO',
    SIM_REMOVAL = 'SIM_RETIRO',
    SIM_FULL_REMOVAL = 'SIM_RETIRO_TOTAL',
    SIM_TRANSFER = 'SIM_TRASLADO'
}

export interface MovementProps {
    id?: string;
    type: MovementType | string; // Permitimos string temporalmente para retrocompatibilidad
    originLocationId: string;
    destinationLocationId: string;
    responsibleId: string;
    receiverId?: string;
    status: MovementStatus;
    activoIds: string[];
    simCardIds?: string[];
    notes?: string;
    evidenceUrl?: string;
    receivedEvidenceUrl?: string;
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
            activoIds: props.activoIds || [],
            simCardIds: props.simCardIds || []
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
        
        const hasActivos = this.props.activoIds && this.props.activoIds.length > 0;
        const hasSIMs = this.props.simCardIds && this.props.simCardIds.length > 0;
        if (!hasActivos && !hasSIMs) {
            throw new Error('Debe haber al menos un activo o una tarjeta SIM en el movimiento');
        }
    }

    get id(): string | undefined { return this.props.id; }
    get type(): string { return this.props.type; }
    get originLocationId(): string { return this.props.originLocationId; }
    get destinationLocationId(): string { return this.props.destinationLocationId; }
    get responsibleId(): string { return this.props.responsibleId; }
    get receiverId(): string | undefined { return this.props.receiverId; }
    get receivedEvidenceUrl(): string | undefined { return this.props.receivedEvidenceUrl; }
    get status(): MovementStatus { return this.props.status; }
    get activoIds(): string[] { return this.props.activoIds; }
    get simCardIds(): string[] { return this.props.simCardIds || []; }
    get notes(): string | undefined { return this.props.notes; }
    get evidenceUrl(): string | undefined { return this.props.evidenceUrl; }
    get createdAt(): Date | undefined { return this.props.createdAt; }
    get shippedAt(): Date | undefined { return this.props.shippedAt; }
    get receivedAt(): Date | undefined { return this.props.receivedAt; }


    public dispatch(evidenceUrl?: string) {
        if (this.props.status !== MovementStatus.PENDING) {
            throw new Error('Solo se pueden despachar movimientos pendientes');
        }
        this.props.status = MovementStatus.EN_TRANSIT;
        this.props.shippedAt = new Date();
        this.props.evidenceUrl = evidenceUrl;
    }

    public receive(receiverId: string, receivedEvidenceUrl: string) {
        if (this.props.status !== MovementStatus.EN_TRANSIT) {
            throw new Error('Solo se pueden recibir movimientos que estén en tránsito');
        }
        this.props.status = MovementStatus.RECEIVED;
        this.props.receivedAt = new Date();
        this.props.receiverId = receiverId;
        this.props.receivedEvidenceUrl = receivedEvidenceUrl;
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
