import { randomUUID } from 'node:crypto';

export enum EstadoCargo {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO'
}

export interface CargoProps {
    id?: string;
    nombre: string;
    estado: EstadoCargo;
    createdAt?: Date;
    updatedAt?: Date;
}

export class Cargo {
    private props: CargoProps;

    constructor(props: CargoProps) {
        this.props = {
            ...props,
            id: props.id || randomUUID(),
            estado: props.estado || EstadoCargo.ACTIVO,
        };
        this.validar();
    }

    private validar() {
        if (!this.props.nombre || !this.props.nombre.trim()) throw new Error('El nombre del cargo es obligatorio');
        if (this.props.nombre.trim().length < 2) throw new Error('El nombre del cargo debe tener al menos 2 caracteres');
        if (!this.props.estado) throw new Error('El estado es obligatorio');
    }

    get id() { return this.props.id; }
    get nombre() { return this.props.nombre; }
    get estado() { return this.props.estado; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }

    public updateNombre(nombre: string) {
        this.props.nombre = nombre.trim();
        this.validar();
    }

    public toggleEstado() {
        this.props.estado = this.props.estado === EstadoCargo.ACTIVO ? EstadoCargo.INACTIVO : EstadoCargo.ACTIVO;
    }

    public toJSON() {
        return {
            ...this.props,
        };
    }
}
