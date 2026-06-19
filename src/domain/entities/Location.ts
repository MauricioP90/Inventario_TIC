import { randomUUID } from 'node:crypto';
import { Coordinates } from '../value-objects/Coordinates';
import { Area } from './Area';

export enum TipoLocation {
    BODEGA = 'BODEGA',
    OFICINA = 'OFICINA',
    REGIONAL = 'REGIONAL',
    PROVEEDOR = 'PROVEEDOR'
}

export interface LocationProps {
    id?: string;
    code: string;
    nombre: string;
    coordenadas?: string | null;
    tipo?: TipoLocation;
    estado: EstadoLocation;
    responsibleIds?: string[];
    areas?: Area[];
    observaciones?: string | null;
}

export enum EstadoLocation {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO'
}

export class Location {
    private props: LocationProps;

    constructor(props: LocationProps) {
        this.props = {
            ...props,
            id: props.id || randomUUID(),
            areas: props.areas || [],
        };
        this.validar();
    }

    private validar() {
        if (!this.props.nombre) throw new Error('El nombre es obligatorio');
        if (this.props.nombre.length < 3 || this.props.nombre.length > 100) throw new Error('El nombre debe tener entre 3 y 100 caracteres');
        if (!this.props.estado) throw new Error('El estado es obligatorio');
        if (this.props.estado !== EstadoLocation.ACTIVO && this.props.estado !== EstadoLocation.INACTIVO) throw new Error('El estado debe ser ACTIVO o INACTIVO');
        if (!this.props.code) throw new Error('El codigo es obligatorio');
    }

    get id() { return this.props.id; }
    get code() { return this.props.code; }
    get nombre() { return this.props.nombre; }
    get coordenadas() { return this.props.coordenadas; }
    get tipo() { return this.props.tipo || TipoLocation.OFICINA; }
    get estado() { return this.props.estado; }
    get responsibleIds() { return this.props.responsibleIds || []; }
    get areas() { return this.props.areas || []; }
    get observaciones() { return this.props.observaciones; }

    public static create(props: LocationProps) {
        return new Location(props);
    }

    public update(props: Partial<LocationProps>) {
        this.props = {
            ...this.props,
            ...props,
            id: this.props.id,// El ID nunca cambia
        };
        this.validar();
    }

    public toJSON() {
        return {
            ...this.props,
            id: this.id
        };
    }
}