import { randomUUID } from 'node:crypto';

export enum EstadoSIM {
    BODEGA = 'BODEGA',
    ASIGNADA = 'ASIGNADA',
    BAJA = 'BAJA'
}

export interface SIMCardProps {
    id?: string;
    iccid: string;
    numero: string;
    operador: string;
    estado: EstadoSIM;
    activoId?: string; // Relación con un Activo (opcional)
    locationId?: string; // Relación con una Location (opcional)
    activo?: { id: string; placa: string; serial?: string; marca?: string } | null;
    location?: { id: string; nombre: string } | null;
}

export class SIMCard {
    private props: SIMCardProps;

    constructor(props: SIMCardProps) {
        this.props = {
            ...props,
            id: props.id || randomUUID(),
        };
    }

    get id() { return this.props.id; }
    get iccid() { return this.props.iccid; }
    get numero() { return this.props.numero; }
    get estado() { return this.props.estado; }
    get operador() { return this.props.operador; }
    get activoId() { return this.props.activoId; }
    get locationId() { return this.props.locationId; }

    public asignarAActivo(activoId: string) {
        this.props.activoId = activoId;
        this.props.estado = EstadoSIM.ASIGNADA;
        // Al estar asignada, hereda lógicamente la ubicación del activo, pero podemos limpiar locationId para no duplicar
        this.props.locationId = undefined;
    }

    public darDeBajaSIM() {
        if (this.props.activoId) {
            throw new Error('No se puede dar de baja una SIM Card que está insertada en un dispositivo. Retírela primero.');
        }
        this.props.estado = EstadoSIM.BAJA;
    }

    public update(props: Partial<SIMCardProps>) {
        this.props = {
            ...this.props,
            ...props,
            id: this.props.id // El ID nunca cambia
        };
    }

    public toJSON() {
        return {
            ...this.props,
            id: this.id
        };
    }
}
