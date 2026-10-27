import { randomUUID } from 'node:crypto';

export interface ActivoDocumentHistoryProps {
    id?: string;
    activoId: string;
    previousFacturaUrl?: string;
    newFacturaUrl?: string;
    previousPrecioCompra?: number;
    newPrecioCompra?: number;
    changedByUser?: string;
    justification?: string;
    createdAt?: Date;
}

export class ActivoDocumentHistory {
    private props: ActivoDocumentHistoryProps;

    constructor(props: ActivoDocumentHistoryProps) {
        this.props = {
            ...props,
            id: props.id || randomUUID(),
            createdAt: props.createdAt || new Date(),
        };
        this.validar();
    }

    private validar() {
        if (!this.props.activoId) {
            throw new Error('El ID del activo es obligatorio para registrar historial de documentos/precio');
        }
    }

    get id(): string | undefined { return this.props.id; }
    get activoId(): string { return this.props.activoId; }
    get previousFacturaUrl(): string | undefined { return this.props.previousFacturaUrl; }
    get newFacturaUrl(): string | undefined { return this.props.newFacturaUrl; }
    get previousPrecioCompra(): number | undefined { return this.props.previousPrecioCompra; }
    get newPrecioCompra(): number | undefined { return this.props.newPrecioCompra; }
    get changedByUser(): string | undefined { return this.props.changedByUser; }
    get justification(): string | undefined { return this.props.justification; }
    get createdAt(): Date | undefined { return this.props.createdAt; }

    toJSON() {
        return {
            id: this.id,
            activoId: this.activoId,
            previousFacturaUrl: this.previousFacturaUrl,
            newFacturaUrl: this.newFacturaUrl,
            previousPrecioCompra: this.previousPrecioCompra,
            newPrecioCompra: this.newPrecioCompra,
            changedByUser: this.changedByUser,
            justification: this.justification,
            createdAt: this.createdAt
        };
    }
}
