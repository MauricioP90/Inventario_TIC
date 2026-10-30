import { SoftwareVersionVO } from "../value-objects/SoftwareVersionVO";

export interface SoftwareVersionProps {
    id: string;
    softwareAppId: string;
    version: SoftwareVersionVO | string;
    esVigente?: boolean;
    notasLanzamiento?: string;
    fechaLanzamiento?: Date;
    createdAt?: Date;
}

export class SoftwareVersion {
    private _id: string;
    private _softwareAppId: string;
    private _version: SoftwareVersionVO;
    private _esVigente: boolean;
    private _notasLanzamiento: string;
    private _fechaLanzamiento: Date;
    private _createdAt: Date;

    constructor(props: SoftwareVersionProps) {
        if (!props.softwareAppId) {
            throw new Error("El id de la aplicación de software es obligatorio.");
        }

        this._id = props.id;
        this._softwareAppId = props.softwareAppId;
        this._version = typeof props.version === 'string'
            ? SoftwareVersionVO.create(props.version)
            : props.version;
        this._esVigente = props.esVigente ?? false;
        this._notasLanzamiento = props.notasLanzamiento ? props.notasLanzamiento.trim() : '';
        this._fechaLanzamiento = props.fechaLanzamiento || new Date();
        this._createdAt = props.createdAt || new Date();
    }

    get id(): string { return this._id; }
    get softwareAppId(): string { return this._softwareAppId; }
    get version(): SoftwareVersionVO { return this._version; }
    get esVigente(): boolean { return this._esVigente; }
    get notasLanzamiento(): string { return this._notasLanzamiento; }
    get fechaLanzamiento(): Date { return this._fechaLanzamiento; }
    get createdAt(): Date { return this._createdAt; }

    marcarComoVigente(): void {
        this._esVigente = true;
    }

    desmarcarVigente(): void {
        this._esVigente = false;
    }

    toJSON() {
        return {
            id: this._id,
            softwareAppId: this._softwareAppId,
            version: this._version.getValue(),
            esVigente: this._esVigente,
            notasLanzamiento: this._notasLanzamiento,
            fechaLanzamiento: this._fechaLanzamiento,
            createdAt: this._createdAt
        };
    }
}
