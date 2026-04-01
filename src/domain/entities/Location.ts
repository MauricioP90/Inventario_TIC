import { randomUUID } from 'node:crypto';

export interface LocationProps {
    id?: string;
    code: string;
    nombre: string;
    coordenadas?: string | null;
    estado: EstadoLocation;
    responsibleIds?: string[];
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
    get estado() { return this.props.estado; }
    get responsibleIds() { return this.props.responsibleIds || []; }

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