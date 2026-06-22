import { randomUUID } from 'node:crypto';
import { Activo } from './Activo';
import { Location } from './Location';
import { Responsible } from './Responsible';

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
    responsibleId?: string; // Custodio heredado (opcional)
    activo?: Activo | null;
    location?: Location | null;
    responsible?: Responsible | null;
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
    get responsibleId() { return this.props.responsibleId; }
    get activo() { return this.props.activo; }
    get location() { return this.props.location; }
    get responsible() { return this.props.responsible; }

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
            id: this.id,
            activo: this.props.activo ? {
                id: this.props.activo.id,
                placa: this.props.activo.placa,
                serial: this.props.activo.serial,
                marca: this.props.activo.marca
            } : null,
            location: this.props.location ? {
                id: this.props.location.id,
                nombre: this.props.location.nombre
            } : null,
            responsible: this.props.responsible ? {
                id: this.props.responsible.id,
                nombre: this.props.responsible.nombre,
                email: this.props.responsible.email
            } : null
        };
    }
}
