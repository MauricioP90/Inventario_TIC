import { randomUUID } from 'node:crypto';
import { SIMCard } from './SIMCard';

export enum EstadoActivo {
    BODEGA = 'BODEGA',
    OPERACION = 'OPERACION',
    MANTENIMIENTO = 'MANTENIMIENTO',
    BAJA = 'BAJA'
}

export interface ActivoProps {
    id?: string;
    placa: string;
    tipo: string;
    marca: string;
    modelo: string;
    serial: string;
    estado: EstadoActivo;
    facturaUrl?: string;
    fechaIngreso: Date;
}

export class Activo {
    private props: ActivoProps;
    private _simCards: SIMCard[] = [];

    constructor(props: ActivoProps) {
        this.props = {
            ...props,
            id: props.id || randomUUID(),
        };
        this.validar();
    }

    private validar() {
        if (!this.props.placa) throw new Error('La placa es obligatoria');
        if (!this.props.serial) throw new Error('El serial es obligatorio');
        if (!this.props.tipo) throw new Error('El tipo es obligatorio');
        if (!this.props.marca) throw new Error('La marca es obligatoria');
        if (!this.props.modelo) throw new Error('El modelo es obligatorio');
        if (!this.props.estado) throw new Error('El estado es obligatorio');
        if (!this.props.fechaIngreso) throw new Error('La fecha de ingreso es obligatoria');
    }

    // Getters
    get id() { return this.props.id; }
    get placa() { return this.props.placa; }
    get serial() { return this.props.serial; }
    get estado() { return this.props.estado; }
    get marca() { return this.props.marca; }
    get modelo() { return this.props.modelo; }
    get tipo() { return this.props.tipo; }
    get facturaUrl() { return this.props.facturaUrl; }
    get fechaIngreso() { return this.props.fechaIngreso; }

    // Lógica de negocio: Cambiar estado
    public darDeBaja() {
        this.props.estado = EstadoActivo.BAJA;
    }

    // Lógica de negocio: Asignar SIMCard
    public asignarSIMCard(simCard: SIMCard) {
        if (this._simCards.length >= 2) {
            throw new Error('El activo ya tiene el numero maximo de SIMCards asignadas');
        }
        this._simCards.push(simCard);
    }
    get simCards() { return this._simCards; }

}
