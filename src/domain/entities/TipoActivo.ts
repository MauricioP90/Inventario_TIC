export enum EstadoTipoActivo {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO'
}

export interface TipoActivoProps {
    id?: string;
    nombre: string;
    estado: EstadoTipoActivo;
}

export class TipoActivo {
    private props: TipoActivoProps;

    constructor(props: TipoActivoProps) {
        this.props = {
            ...props,
            estado: props.estado || EstadoTipoActivo.ACTIVO,
        };
        this.validar();
    }

    private validar() {
        if (!this.props.nombre) throw new Error('El nombre es obligatorio');
        if (this.props.nombre.length < 3 || this.props.nombre.length > 40) throw new Error('El nombre debe tener entre 3 y 100 caracteres');
        if (!this.props.estado) throw new Error('El estado es obligatorio');
        if (this.props.estado !== EstadoTipoActivo.ACTIVO && this.props.estado !== EstadoTipoActivo.INACTIVO) throw new Error('El estado debe ser ACTIVO o INACTIVO');
    }

    get id() { return this.props.id; }
    get estado() { return this.props.estado; }
    get nombre() { return this.props.nombre; }

    public update(props: Partial<TipoActivoProps>) {
        this.props = {
            ...this.props,
            ...props,
            id: this.props.id // El ID nunca cambia
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