import { randomUUID } from 'node:crypto';
import { SIMCard } from './SIMCard';
import { Location, EstadoLocation } from './Location';
import { Responsible } from './Responsible';

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
    location?: Location;
    locationId?: string;
    responsable?: Responsible;
    responsibleId?: string;
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
        if (!this.props.location && !this.props.locationId) throw new Error('La ubicación es obligatoria');
        if (!this.props.responsable && !this.props.responsibleId) throw new Error('El responsable es obligatorio');
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
    get location() { return this.props.location; }
    get locationId() { return this.props.locationId; }
    get responsable() { return this.props.responsable; }
    get responsibleId() { return this.props.responsibleId; }

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

    // Lógica de negocio: Asignar Responsable
    public asignarResponsable(responsable: Responsible) {

        if (!responsable) throw new Error('El responsable es obligatorio');
        this.props.responsable = responsable;
    }

    // Lógica de negocio: Asignar Ubicación
    public asignarUbicacion(location: Location) {
        if (!location) throw new Error('La ubicación es obligatoria');
        if (location.estado !== EstadoLocation.ACTIVO) throw new Error('La ubicación debe estar activa');
        if (this.props.location && this.props.location.id === location.id) throw new Error('El activo no puede estar en mas de una ubicacion');
        this.props.location = location;
    }


    public update(props: Partial<ActivoProps>) {
        this.props = {
            ...this.props,
            ...props,
            id: this.props.id // El ID nunca cambia
        };
    }

    public toJSON() {
        return {
            ...this.props,
            id: this.id, // Asegurar que el ID esté presente
            simCards: this._simCards // Incluir SIMCards
        };
    }
}
