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
    PROVIDER_WARRANTY = 'ENVIO_PROVEEDOR',
    PROVIDER_RETURN = 'RETORNO_PROVEEDOR',
    DISPOSAL = 'BAJA_ACTIVO',
    RETURN_BY_REJECTION = 'RETORNO_POR_RECHAZO',
    INGRESO_MANTENIMIENTO = 'INGRESO_MANTENIMIENTO',
    SALIDA_MANTENIMIENTO = 'SALIDA_MANTENIMIENTO',
    // SIM Cards
    SIM_ASSIGNMENT = 'SIM_ASIGNACION',
    SIM_CHANGE = 'SIM_CAMBIO',
    SIM_REMOVAL = 'SIM_RETIRO',
    SIM_FULL_REMOVAL = 'SIM_RETIRO_TOTAL',
    SIM_TRANSFER = 'SIM_TRASLADO'
}

export interface MovementProps {
    id?: string;
    parentMovementId?: string;
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
    magicLinkToken?: string;
    physicalReceiverName?: string;
    originLocation?: any;
    destinationLocation?: any;
    responsible?: any;
    receiver?: any;
    activos?: any[];
    simCards?: any[];
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
        const isLocalSIMMovement = [
            'SIM_ASIGNACION',
            'SIM_CAMBIO',
            'SIM_RETIRO',
            'SIM_RETIRO_TOTAL',
            'INGRESO_MANTENIMIENTO',
            'SALIDA_MANTENIMIENTO'
        ].includes(this.props.type);

        // Permitimos movimientos dentro de la misma sede para traslados entre diferentes áreas/responsables.
        if (false && !isLocalSIMMovement && this.props.originLocationId === this.props.destinationLocationId) {
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
    get parentMovementId(): string | undefined { return this.props.parentMovementId; }
    get type(): string { return this.props.type; }
    get originLocationId(): string { return this.props.originLocationId; }
    get destinationLocationId(): string { return this.props.destinationLocationId; }
    get responsibleId(): string { return this.props.responsibleId; }
    get receiverId(): string | undefined { return this.props.receiverId; }
    get receivedEvidenceUrl(): string | undefined { return this.props.receivedEvidenceUrl; }
    get status(): MovementStatus { return this.props.status; }
    get activoIds(): string[] { return this.props.activoIds; }
    get simCardIds(): string[] { return this.props.simCardIds || []; }
    get simCards(): any[] { return this.props.simCards || []; }
    get notes(): string | undefined { return this.props.notes; }
    get evidenceUrl(): string | undefined { return this.props.evidenceUrl; }
    get createdAt(): Date | undefined { return this.props.createdAt; }
    get shippedAt(): Date | undefined { return this.props.shippedAt; }
    get receivedAt(): Date | undefined { return this.props.receivedAt; }
    get magicLinkToken(): string | undefined { return this.props.magicLinkToken; }
    get physicalReceiverName(): string | undefined { return this.props.physicalReceiverName; }


    public dispatch(evidenceUrl?: string) {
        if (this.props.status !== MovementStatus.PENDING) {
            throw new Error('Solo se pueden despachar movimientos pendientes');
        }
        this.props.status = MovementStatus.EN_TRANSIT;
        this.props.shippedAt = new Date();
        this.props.evidenceUrl = evidenceUrl;
        
        // Generar magic link token
        const { randomUUID } = require('node:crypto');
        this.props.magicLinkToken = randomUUID();
    }

    public receive(receiverId: string | undefined, receivedEvidenceUrl: string, physicalReceiverName?: string) {
        if (this.props.status !== MovementStatus.EN_TRANSIT) {
            throw new Error('Solo se pueden recibir movimientos que estén en tránsito');
        }
        this.props.status = MovementStatus.RECEIVED;
        this.props.receivedAt = new Date();
        if (receiverId) this.props.receiverId = receiverId; // Solo se asigna si viene un ID válido
        this.props.receivedEvidenceUrl = receivedEvidenceUrl;
        this.props.physicalReceiverName = physicalReceiverName;
        
        // El token mágico se consume
        this.props.magicLinkToken = undefined;
    }

    public cancel() {
        if (this.props.status === MovementStatus.RECEIVED) {
            throw new Error('No se puede cancelar un movimiento ya recibido');
        }
        this.props.status = MovementStatus.CANCELLED;
    }

    public changeDestinationLocation(locationId: string) {
        if (locationId === this.props.originLocationId) {
            throw new Error('La sede de destino no puede ser igual a la de origen');
        }
        this.props.destinationLocationId = locationId;
    }

    public toJSON() {
        return {
            ...this.props
        };
    }
}
