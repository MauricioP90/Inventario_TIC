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

    /**
     * Calcula la distancia geodésica en kilómetros hacia otra coordenada
     * utilizando la fórmula de Haversine.
     */
    public distanceInKmTo(other: Coordinates): number {
        const R = 6371; // Radio medio de la Tierra en kilómetros
        const dLat = this.toRadians(other.lat - this.lat);
        const dLon = this.toRadians(other.lon - this.lon);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(this.lat)) *
            Math.cos(this.toRadians(other.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return Math.round(distance * 100) / 100;
    }

    public isWithinRadiusKm(other: Coordinates, radiusKm: number): boolean {
        return this.distanceInKmTo(other) <= radiusKm;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}
