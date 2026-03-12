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

    public asignarAActivo(activoId: string) {
        this.props.activoId = activoId;
        this.props.estado = EstadoSIM.ASIGNADA;
    }

    public darDeBajaSIM() {
        this.props.estado = EstadoSIM.BAJA;
    }

    public update(props: Partial<SIMCardProps>) {
        this.props = {
            ...this.props,
            ...props,
            id: this.props.id // El ID nunca cambia
        };
    }

}
