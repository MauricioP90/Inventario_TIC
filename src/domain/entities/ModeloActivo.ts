import { randomUUID } from 'node:crypto';

export enum EstadoModeloActivo {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO'
}

export interface ModeloActivoProps {
    id?: string;
    tipoActivoId: string;
    marca: string;
    modelo: string;
    estado?: EstadoModeloActivo;
    createdAt?: Date;
}

export class ModeloActivo {
    private props: ModeloActivoProps;

    constructor(props: ModeloActivoProps) {
        this.props = {
            ...props,
            id: props.id || randomUUID(),
            estado: props.estado || EstadoModeloActivo.ACTIVO,
            createdAt: props.createdAt || new Date()
        };
        this.validar();
    }

    private validar() {
        if (!this.props.tipoActivoId) throw new Error('El tipo de activo es obligatorio');
        if (!this.props.marca || !this.props.marca.trim()) throw new Error('La marca es obligatoria');
        if (!this.props.modelo || !this.props.modelo.trim()) throw new Error('El modelo es obligatorio');
        if (!this.props.estado) throw new Error('El estado es obligatorio');
        if (this.props.estado !== EstadoModeloActivo.ACTIVO && this.props.estado !== EstadoModeloActivo.INACTIVO) {
            throw new Error('El estado debe ser ACTIVO o INACTIVO');
        }
    }

    get id(): string { return this.props.id!; }
    get tipoActivoId(): string { return this.props.tipoActivoId; }
    get marca(): string { return this.props.marca; }
    get modelo(): string { return this.props.modelo; }
    get estado(): EstadoModeloActivo { return this.props.estado!; }
    get createdAt(): Date { return this.props.createdAt!; }

    public update(props: Partial<Pick<ModeloActivoProps, 'tipoActivoId' | 'marca' | 'modelo' | 'estado'>>) {
        this.props = {
            ...this.props,
            ...props,
            id: this.props.id
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
