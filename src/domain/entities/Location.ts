import { randomUUID } from 'node:crypto';

export interface LocationProps {
    id?: string;
    code: string;
    nombre: string;
    direccion: string;
    estado: EstadoLocation;
    responsableId: string;
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
        if (this.props.nombre.length < 3 || this.props.nombre.length > 50) throw new Error('El nombre debe tener entre 3 y 50 caracteres');
        if (!this.props.direccion) throw new Error('La direccion es obligatoria');
        if (!this.props.estado) throw new Error('El estado es obligatorio');
        if (this.props.estado !== EstadoLocation.ACTIVO && this.props.estado !== EstadoLocation.INACTIVO) throw new Error('El estado debe ser ACTIVO o INACTIVO');
        if (!this.props.responsableId) throw new Error('El responsable es obligatorio');
        if (!this.props.code) throw new Error('El codigo es obligatorio');
    }

    get id() { return this.props.id; }
    get code() { return this.props.code; }
    get nombre() { return this.props.nombre; }
    get direccion() { return this.props.direccion; }
    get estado() { return this.props.estado; }
    get responsableId() { return this.props.responsableId; }

    public create(props: LocationProps) {
        this.props = {
            ...props,
            id: props.id || randomUUID(),
            responsableId: props.responsableId,
        };
    }

    public update(props: Partial<LocationProps>) {
        this.props = {
            ...this.props,
            ...props,
            id: this.props.id,// El ID nunca cambia
        };
    }

    public toJSON() {
        return {
            ...this.props,
            id: this.id
        };
    }
}