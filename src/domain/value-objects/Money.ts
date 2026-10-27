export class Money {
    private readonly _amount: number;
    private readonly _currency: string;

    private constructor(amount: number, currency: string = 'COP') {
        if (isNaN(amount) || !isFinite(amount)) {
            throw new Error('El valor monetario debe ser un número válido');
        }
        if (amount < 0) {
            throw new Error('El valor monetario no puede ser negativo');
        }
        this._amount = Math.round(amount * 100) / 100;
        this._currency = (currency || 'COP').trim().toUpperCase();
    }

    public static create(amount: number, currency: string = 'COP'): Money {
        return new Money(amount, currency);
    }

    public static zero(currency: string = 'COP'): Money {
        return new Money(0, currency);
    }

    public static fromNumber(amount: number, currency: string = 'COP'): Money {
        return new Money(amount, currency);
    }

    public get amount(): number {
        return this._amount;
    }

    public get currency(): string {
        return this._currency;
    }

    public add(other: Money): Money {
        this.ensureSameCurrency(other);
        return new Money(this._amount + other._amount, this._currency);
    }

    public subtract(other: Money): Money {
        this.ensureSameCurrency(other);
        const result = this._amount - other._amount;
        if (result < 0) {
            throw new Error('El resultado de la sustracción monetaria no puede ser negativo');
        }
        return new Money(result, this._currency);
    }

    public multiply(factor: number): Money {
        if (isNaN(factor) || factor < 0) {
            throw new Error('El factor de multiplicación debe ser un número positivo');
        }
        return new Money(this._amount * factor, this._currency);
    }

    public format(): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: this._currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(this._amount);
    }

    public equals(other?: Money | null): boolean {
        if (!other) return false;
        return this._amount === other._amount && this._currency === other._currency;
    }

    public isGreaterThan(other: Money): boolean {
        this.ensureSameCurrency(other);
        return this._amount > other._amount;
    }

    public isLessThan(other: Money): boolean {
        this.ensureSameCurrency(other);
        return this._amount < other._amount;
    }

    private ensureSameCurrency(other: Money) {
        if (this._currency !== other._currency) {
            throw new Error(`Monedas incompatibles: ${this._currency} y ${other._currency}`);
        }
    }

    public toString(): string {
        return `${this._amount} ${this._currency}`;
    }

    public toJSON(): number {
        return this._amount;
    }
}
