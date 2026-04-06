import { randomUUID } from 'node:crypto';

export enum EstadoRole {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO'
}

export interface RoleProps {
    id?: string;
    nombre: string;
    estado: EstadoRole;
}

export class Role {
    private props: RoleProps;

    constructor(props: RoleProps) {
        this.props = {
            ...props,
            id: props.id || randomUUID(),
            estado: props.estado || EstadoRole.ACTIVO,
        };
        this.validar();
    }

    private validar() {
        if (!this.props.nombre) throw new Error('El nombre es obligatorio');
        if (!this.props.estado) throw new Error('El estado es obligatorio');
    }

    get id() { return this.props.id; }
    get nombre() { return this.props.nombre; }
    get estado() { return this.props.estado; }

    public inactivate() {
        this.props.estado = EstadoRole.INACTIVO;
    }

    public toJSON() {
        return {
            ...this.props,
        };
    }
}