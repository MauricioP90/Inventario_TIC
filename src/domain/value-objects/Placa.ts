export class Placa {
    private readonly _value: string;

    private constructor(value: string) {
        this._value = this.validateAndNormalize(value);
    }

    private validateAndNormalize(raw: string): string {
        if (!raw || typeof raw !== 'string') {
            throw new Error('La placa de inventario es obligatoria');
        }
        const trimmed = raw.trim().toUpperCase();
        if (trimmed.length < 4 || trimmed.length > 20) {
            throw new Error('La placa debe tener entre 4 y 20 caracteres');
        }
        // Permite formato estándar corporativo 0000-000000 y prefijos alfanuméricos autorizados (ej: ACID-123456)
        const validPattern = /^[A-Z0-9]{3,6}-[A-Z0-9]{4,8}$/;
        if (!validPattern.test(trimmed)) {
            throw new Error(`El formato de la placa "${raw}" no es válido. Debe cumplir el patrón corporativo (ej: 0000-000000)`);
        }
        return trimmed;
    }

    public static create(value: string): Placa {
        return new Placa(value);
    }

    public static isValid(value: string): boolean {
        try {
            Placa.create(value);
            return true;
        } catch {
            return false;
        }
    }

    public static isStrictStandard(value: string): boolean {
        return /^\d{4}-\d{6}$/.test((value || '').trim());
    }

    public get value(): string {
        return this._value;
    }

    public toString(): string {
        return this._value;
    }

    public equals(other?: Placa | null): boolean {
        if (!other) return false;
        return this._value === other._value;
    }
}
