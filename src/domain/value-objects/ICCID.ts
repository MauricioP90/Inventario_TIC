export class ICCID {
    private readonly _value: string;

    private constructor(value: string) {
        this._value = this.validateAndNormalize(value);
    }

    private validateAndNormalize(raw: string): string {
        if (!raw || typeof raw !== 'string') {
            throw new Error('El código ICCID es obligatorio');
        }
        const cleaned = raw.trim().replace(/\s+/g, '');
        // Acepta números entre 10 y 22 dígitos (soporta legacy/test y estándar ITU-T E.118 de 19-20 dígitos)
        if (!/^\d{10,22}$/.test(cleaned)) {
            throw new Error(`El código ICCID "${raw}" no es válido. Debe contener entre 10 y 22 dígitos numéricos.`);
        }
        return cleaned;
    }

    public static create(value: string): ICCID {
        return new ICCID(value);
    }

    public static isValid(value: string): boolean {
        try {
            ICCID.create(value);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Valida si cumple estrictamente la norma ITU-T E.118 de telecomunicaciones (prefijo 89 + 17 a 18 dígitos).
     */
    public static isTelecomStandard(value: string): boolean {
        return /^89\d{16,20}$/.test((value || '').trim().replace(/\s+/g, ''));
    }

    public get value(): string {
        return this._value;
    }

    public toString(): string {
        return this._value;
    }

    public equals(other?: ICCID | null): boolean {
        if (!other) return false;
        return this._value === other._value;
    }
}
