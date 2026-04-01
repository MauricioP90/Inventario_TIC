import { randomUUID } from 'node:crypto';

export enum EstadoResponsable {
    ACTIVO = 'ACTIVO',
    INACTIVO = 'INACTIVO'
}

export interface ResponsibleProps {
    id?: string;
    nombre: string;
    email: string;
    telefono: string;
    estado: EstadoResponsable;
    rol: string;
    locationIds?: string[];
    totalActivos?: number;
    totalSIMCards?: number;
}

export class Responsible {
    private props: ResponsibleProps;

    constructor(props: ResponsibleProps) {
        this.props = {
            ...props,
            id: props.id || randomUUID(),
        };

        this.validar();
    }

    private validar() {
        if (!this.props.nombre) throw new Error('El nombre es obligatorio');
        if (this.props.nombre.length < 3 || this.props.nombre.length > 50) throw new Error('El nombre debe tener entre 3 y 50 caracteres');
        if (!this.props.email) throw new Error('El email es obligatorio');
        if (!this.props.email.includes('@')) throw new Error('El email es invalido');
        if (this.props.email.length > 70) throw new Error('El email debe tener menos de 70 caracteres');
        if (!this.props.telefono) throw new Error('El telefono es obligatorio');
        if (this.props.telefono.length > 20) throw new Error('El telefono debe tener menos de 20 caracteres'); // Ampliado por el refactor
        if (this.props.telefono.length < 7) throw new Error('El telefono debe tener mas de 7 caracteres');
        if (!this.props.estado) throw new Error('El estado es obligatorio');
    }

    get id() { return this.props.id; }
    get nombre() { return this.props.nombre; }
    get email() { return this.props.email; }
    get telefono() { return this.props.telefono; }
    get estado() { return this.props.estado; }
    get rol() { return this.props.rol; }
    get locationIds() { return this.props.locationIds || []; }
    get totalActivos() { return this.props.totalActivos || 0; }
    get totalSIMCards() { return this.props.totalSIMCards || 0; }

    public update(props: Partial<ResponsibleProps>) {
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