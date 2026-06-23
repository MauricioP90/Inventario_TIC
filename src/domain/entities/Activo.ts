import { randomUUID } from 'node:crypto';
import { SIMCard } from './SIMCard';
import { Location, EstadoLocation } from './Location';
import { Responsible } from './Responsible';
import { TipoActivo } from './TipoActivo';
import { Area } from './Area';

export enum EstadoActivo {
    DISPONIBLE = 'DISPONIBLE',
    OPERACION = 'OPERACION',
    MANTENIMIENTO = 'MANTENIMIENTO',
    BAJA = 'BAJA',
    EN_TRANSIT = 'EN_TRANSITO',
    RECHAZADO = 'RECHAZADO'
}

export interface ActivoProps {
    id?: string;
    placa: string;
    tipoActivoId: string;
    marca: string;
    modelo: string;
    serial: string;
    location?: Location;
    locationId?: string;
    responsible?: Responsible;
    responsibleId?: string;
    tipoActivo?: TipoActivo;
    areaId: string;
    area?: Area;
    estado: EstadoActivo;
    facturaUrl?: string;
    fechaIngreso: Date;
    precioCompra?: number;
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
        if (!this.props.tipoActivoId) throw new Error('El tipo es obligatorio');
        if (!this.props.marca) throw new Error('La marca es obligatoria');
        if (!this.props.modelo) throw new Error('El modelo es obligatorio');
        if (!this.props.estado) throw new Error('El estado es obligatorio');
        if (!this.props.fechaIngreso) throw new Error('La fecha de ingreso es obligatoria');
        if (!this.props.location && !this.props.locationId) throw new Error('La ubicación es obligatoria');
        if (!this.props.responsible && !this.props.responsibleId) throw new Error('El responsable es obligatorio');
        if (!this.props.areaId) throw new Error('El área es obligatoria');
    }

    // Getters
    get id() { return this.props.id; }
    get placa() { return this.props.placa; }
    get serial() { return this.props.serial; }
    get estado() { return this.props.estado; }
    get marca() { return this.props.marca; }
    get modelo() { return this.props.modelo; }
    get tipoActivoId() { return this.props.tipoActivoId; }
    get tipoActivo() { return this.props.tipoActivo; }
    get facturaUrl() { return this.props.facturaUrl; }
    get fechaIngreso() { return this.props.fechaIngreso; }
    get location() { return this.props.location; }
    get locationId() { return this.props.locationId; }
    get responsible() { return this.props.responsible; }
    get responsibleId() { return this.props.responsibleId; }
    get areaId() { return this.props.areaId; }
    get area() { return this.props.area; }
    get precioCompra() { return this.props.precioCompra; }

    // Lógica de negocio: Cambiar estado
    public darDeBaja() {
        if (!this.puedeDarDeBaja()) {
            throw new Error('No se puede dar de baja el activo porque tiene SIM Cards asociadas activas');
        }
        this.props.estado = EstadoActivo.BAJA;
    }

    public puedeDarDeBaja(): boolean {
        return !this._simCards || this._simCards.length === 0;
    }

    public aplicarRecepcionDeMovimiento(tipoMovimiento: string, destinationLocationId: string) {
        if (!destinationLocationId) throw new Error('La ubicación de destino es obligatoria');
        
        // Actualizar ubicación
        this.changeLocation(destinationLocationId);

        // Mapear tipo de movimiento a estado de activo
        const tipo = tipoMovimiento.toUpperCase();
        if (
            tipo === 'ASIGNACION_OFICINA' || 
            tipo === 'TRASLADO_REGIONAL' || 
            tipo === 'SALIDA_PRESTAMO' ||
            tipo === 'ASIGNACION' ||
            tipo === 'TRASLADO'
        ) {
            this.setStatus(EstadoActivo.OPERACION);
        } else if (tipo === 'RETORNO_SOPORTE' || tipo === 'REINGRESO_SOPORTE' || tipo === 'RETORNO_PROVEEDOR' || tipo === 'SALIDA_MANTENIMIENTO') {
            this.setStatus(EstadoActivo.DISPONIBLE);
        } else if (tipo === 'ENVIO_PROVEEDOR' || tipo === 'RETORNO_POR_RECHAZO' || tipo === 'INGRESO_MANTENIMIENTO') {
            this.setStatus(EstadoActivo.MANTENIMIENTO);
        } else if (tipo === 'BAJA_ACTIVO') {
            this.setStatus(EstadoActivo.BAJA);
        }
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
        this.props.responsible = responsable;
        this.props.responsibleId = responsable.id;
    }

    // Lógica de negocio: Asignar Ubicación
    public asignarUbicacion(location: Location) {
        if (!location) throw new Error('La ubicación es obligatoria');
        if (location.estado !== EstadoLocation.ACTIVO) throw new Error('La ubicación debe estar activa');
        if (this.props.location && this.props.location.id === location.id) {
            return;
        }
        this.props.location = location;
        this.props.locationId = location.id;
    }


    public changeLocation(locationId: string) {
        if (!locationId) throw new Error('La ubicación es obligatoria');
        this.props.locationId = locationId;
        // Opcional: limpiar la referencia del objeto location cargado para forzar recarga
        this.props.location = undefined;
    }

    public changeArea(areaId: string) {
        if (!areaId) throw new Error('El área es obligatoria');
        this.props.areaId = areaId;
        this.props.area = undefined;
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
            id: this.id,
            simCards: this._simCards,
            location: this.props.location ? this.props.location.toJSON() : undefined,
            responsible: this.props.responsible ? this.props.responsible.toJSON() : undefined,
            area: this.props.area ? this.props.area.toJSON() : undefined,
            tipoActivo: this.props.tipoActivo ? this.props.tipoActivo : undefined
        };
    }

    public setStatus(status: EstadoActivo) {
        this.props.estado = status;
    }
}
