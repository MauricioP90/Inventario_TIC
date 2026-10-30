export interface SoftwareAppProps {
    id: string;
    nombre: string;
    descripcion?: string;
    estado: 'ACTIVO' | 'INACTIVO';
    createdAt?: Date;
    updatedAt?: Date;
}

export class SoftwareApp {
    private _id: string;
    private _nombre: string;
    private _descripcion: string;
    private _estado: 'ACTIVO' | 'INACTIVO';
    private _createdAt: Date;
    private _updatedAt: Date;

    constructor(props: SoftwareAppProps) {
        if (!props.nombre || props.nombre.trim().length === 0) {
            throw new Error("El nombre de la aplicación de software es obligatorio.");
        }
        this._id = props.id;
        this._nombre = props.nombre.trim();
        this._descripcion = props.descripcion ? props.descripcion.trim() : '';
        this._estado = props.estado || 'ACTIVO';
        this._createdAt = props.createdAt || new Date();
        this._updatedAt = props.updatedAt || new Date();
    }

    get id(): string { return this._id; }
    get nombre(): string { return this._nombre; }
    get descripcion(): string { return this._descripcion; }
    get estado(): 'ACTIVO' | 'INACTIVO' { return this._estado; }
    get createdAt(): Date { return this._createdAt; }
    get updatedAt(): Date { return this._updatedAt; }

    update(nombre: string, descripcion?: string): void {
        if (!nombre || nombre.trim().length === 0) {
            throw new Error("El nombre de la aplicación no puede estar vacío.");
        }
        this._nombre = nombre.trim();
        if (descripcion !== undefined) {
            this._descripcion = descripcion.trim();
        }
        this._updatedAt = new Date();
    }

    inactivar(): void {
        this._estado = 'INACTIVO';
        this._updatedAt = new Date();
    }

    activar(): void {
        this._estado = 'ACTIVO';
        this._updatedAt = new Date();
    }

    toJSON() {
        return {
            id: this._id,
            nombre: this._nombre,
            descripcion: this._descripcion,
            estado: this._estado,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt
        };
    }
}
