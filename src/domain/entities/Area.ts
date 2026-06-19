import { randomUUID } from 'node:crypto';

export enum EstadoArea {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO'
}

export interface AreaProps {
    id?: string;
    code: string;
    nombre: string;
    estado: EstadoArea;
}

export class Area {
    private props: AreaProps;

    constructor(props: AreaProps) {
        this.props = {
            ...props,
            id: props.id || randomUUID(),
            estado: props.estado || EstadoArea.ACTIVO,
        };
        this.validar();
    }

    private validar() {
        if (!this.props.code) throw new Error('El código es obligatorio');
        if (!this.props.nombre) throw new Error('El nombre es obligatorio');
        if (!this.props.estado) throw new Error('El estado es obligatorio');
    }

    get id() { return this.props.id; }
    get code() { return this.props.code; }
    get nombre() { return this.props.nombre; }
    get estado() { return this.props.estado; }

    public inactivate() {
        this.props.estado = EstadoArea.INACTIVO;
    }

    public toJSON() {
        return {
            ...this.props,
        };
    }
}
