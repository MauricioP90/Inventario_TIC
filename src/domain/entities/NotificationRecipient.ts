import { randomUUID } from 'node:crypto';

export interface NotificationRecipientProps {
    id?: string;
    email: string;
    nombre: string;
    area: string;
    tipoCopia?: 'CC' | 'BCC';
    isActive?: boolean;
    eventos?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

export class NotificationRecipient {
    private props: NotificationRecipientProps;

    constructor(props: NotificationRecipientProps) {
        if (!props.email || !props.email.includes('@')) {
            throw new Error('El correo electrónico es inválido o está vacío.');
        }
        if (!props.nombre || props.nombre.trim() === '') {
            throw new Error('El nombre del destinatario es obligatorio.');
        }
        if (!props.area || props.area.trim() === '') {
            throw new Error('El área o departamento es obligatorio.');
        }

        const rawEventos = props.eventos && props.eventos.length > 0
            ? props.eventos
            : ['DESPACHO_TRASLADO', 'RECEPCION_TRASLADO'];

        this.props = {
            ...props,
            id: props.id || randomUUID(),
            email: props.email.trim().toLowerCase(),
            nombre: props.nombre.trim(),
            area: props.area.trim(),
            tipoCopia: props.tipoCopia || 'CC',
            isActive: props.isActive !== undefined ? props.isActive : true,
            eventos: Array.from(new Set(rawEventos)),
            createdAt: props.createdAt || new Date(),
            updatedAt: props.updatedAt || new Date()
        };
    }

    get id(): string | undefined { return this.props.id; }
    get email(): string { return this.props.email; }
    get nombre(): string { return this.props.nombre; }
    get area(): string { return this.props.area; }
    get tipoCopia(): 'CC' | 'BCC' { return this.props.tipoCopia || 'CC'; }
    get isActive(): boolean { return this.props.isActive !== false; }
    get eventos(): string[] { return this.props.eventos || []; }
    get createdAt(): Date | undefined { return this.props.createdAt; }
    get updatedAt(): Date | undefined { return this.props.updatedAt; }

    public isSubscribedTo(evento: string): boolean {
        if (!this.isActive) return false;
        const evs = this.props.eventos || [];
        return evs.includes('TODOS') || evs.includes(evento);
    }

    public update(data: Partial<Omit<NotificationRecipientProps, 'id' | 'createdAt'>>): void {
        if (data.email !== undefined) {
            if (!data.email || !data.email.includes('@')) {
                throw new Error('El correo electrónico es inválido o está vacío.');
            }
            this.props.email = data.email.trim().toLowerCase();
        }
        if (data.nombre !== undefined) {
            if (!data.nombre || data.nombre.trim() === '') {
                throw new Error('El nombre del destinatario es obligatorio.');
            }
            this.props.nombre = data.nombre.trim();
        }
        if (data.area !== undefined) {
            if (!data.area || data.area.trim() === '') {
                throw new Error('El área o departamento es obligatorio.');
            }
            this.props.area = data.area.trim();
        }
        if (data.tipoCopia !== undefined) {
            this.props.tipoCopia = data.tipoCopia;
        }
        if (data.isActive !== undefined) {
            this.props.isActive = data.isActive;
        }
        if (data.eventos !== undefined) {
            this.props.eventos = Array.from(new Set(data.eventos));
        }
        this.props.updatedAt = new Date();
    }

    public toggleActive(): void {
        this.props.isActive = !this.props.isActive;
        this.props.updatedAt = new Date();
    }
}
