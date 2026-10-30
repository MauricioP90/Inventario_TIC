export interface ActivoSoftwareHistoryProps {
    id: string;
    activoId: string;
    softwareVersionId: string;
    licencia?: string;
    estado?: 'INSTALADO' | 'ACTUALIZADO' | 'RETIRADO';
    fechaInstalacion?: Date;
    fechaRetiro?: Date;
    instaladoPor: string;
    retiradoPor?: string;
    observaciones?: string;
    createdAt?: Date;
}

export class ActivoSoftwareHistory {
    private _id: string;
    private _activoId: string;
    private _softwareVersionId: string;
    private _licencia: string;
    private _estado: 'INSTALADO' | 'ACTUALIZADO' | 'RETIRADO';
    private _fechaInstalacion: Date;
    private _fechaRetiro?: Date;
    private _instaladoPor: string;
    private _retiradoPor?: string;
    private _observaciones: string;
    private _createdAt: Date;

    constructor(props: ActivoSoftwareHistoryProps) {
        if (!props.activoId) {
            throw new Error("El activoId es obligatorio.");
        }
        if (!props.softwareVersionId) {
            throw new Error("El softwareVersionId es obligatorio.");
        }
        if (!props.instaladoPor) {
            throw new Error("El usuario que instala el software es obligatorio.");
        }

        this._id = props.id;
        this._activoId = props.activoId;
        this._softwareVersionId = props.softwareVersionId;
        this._licencia = props.licencia ? props.licencia.trim() : '';
        this._estado = props.estado || 'INSTALADO';
        this._fechaInstalacion = props.fechaInstalacion || new Date();
        this._fechaRetiro = props.fechaRetiro;
        this._instaladoPor = props.instaladoPor.trim();
        this._retiradoPor = props.retiradoPor?.trim();
        this._observaciones = props.observaciones ? props.observaciones.trim() : '';
        this._createdAt = props.createdAt || new Date();
    }

    get id(): string { return this._id; }
    get activoId(): string { return this._activoId; }
    get softwareVersionId(): string { return this._softwareVersionId; }
    get licencia(): string { return this._licencia; }
    get estado(): 'INSTALADO' | 'ACTUALIZADO' | 'RETIRADO' { return this._estado; }
    get fechaInstalacion(): Date { return this._fechaInstalacion; }
    get fechaRetiro(): Date | undefined { return this._fechaRetiro; }
    get instaladoPor(): string { return this._instaladoPor; }
    get retiradoPor(): string | undefined { return this._retiradoPor; }
    get observaciones(): string { return this._observaciones; }
    get createdAt(): Date { return this._createdAt; }

    marcarActualizado(fecha: Date = new Date()): void {
        this._estado = 'ACTUALIZADO';
        this._fechaRetiro = fecha;
    }

    retirar(retiradoPor: string, fecha: Date = new Date(), observaciones?: string): void {
        this._estado = 'RETIRADO';
        this._fechaRetiro = fecha;
        this._retiradoPor = retiradoPor.trim();
        if (observaciones) {
            this._observaciones = observaciones.trim();
        }
    }

    toJSON() {
        return {
            id: this._id,
            activoId: this._activoId,
            softwareVersionId: this._softwareVersionId,
            licencia: this._licencia,
            estado: this._estado,
            fechaInstalacion: this._fechaInstalacion,
            fechaRetiro: this._fechaRetiro,
            instaladoPor: this._instaladoPor,
            retiradoPor: this._retiradoPor,
            observaciones: this._observaciones,
            createdAt: this._createdAt
        };
    }
}
