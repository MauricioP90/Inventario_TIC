export class Coordinates {
    private readonly lat: number;
    private readonly lon: number;

    private constructor(lat: number, lon: number) {
        this.lat = lat;
        this.lon = lon;
        this.validate();
    }

    private validate() {
        if (isNaN(this.lat) || this.lat < -90 || this.lat > 90) {
            throw new Error('La latitud debe ser un número entre -90 y 90');
        }
        if (isNaN(this.lon) || this.lon < -180 || this.lon > 180) {
            throw new Error('La longitud debe ser un número entre -180 y 180');
        }
    }

    public static fromString(value: string): Coordinates {
        if (!value) {
            throw new Error('Las coordenadas no pueden estar vacías');
        }
        const parts = value.split(',');
        if (parts.length !== 2) {
            throw new Error('El formato de las coordenadas debe ser "latitud, longitud"');
        }
        const lat = parseFloat(parts[0].trim());
        const lon = parseFloat(parts[1].trim());
        return new Coordinates(lat, lon);
    }

    public static create(lat: number, lon: number): Coordinates {
        return new Coordinates(lat, lon);
    }

    public get latitude(): number {
        return this.lat;
    }

    public get longitude(): number {
        return this.lon;
    }

    public toString(): string {
        return `${this.lat},${this.lon}`;
    }
}
