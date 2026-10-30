export class SoftwareVersionVO {
    private readonly value: string;
    private readonly major: number;
    private readonly minor: number;
    private readonly patch: number;

    private constructor(rawVersion: string) {
        const cleaned = rawVersion.trim().replace(/^[vV]/, '');
        if (!cleaned) {
            throw new Error("La versión de software no puede estar vacía.");
        }

        const segments = cleaned.split('.').map(s => {
            const parsed = parseInt(s, 10);
            return isNaN(parsed) ? 0 : parsed;
        });

        this.major = segments[0] ?? 0;
        this.minor = segments[1] ?? 0;
        this.patch = segments[2] ?? 0;
        this.value = cleaned;
    }

    public static create(rawVersion: string): SoftwareVersionVO {
        return new SoftwareVersionVO(rawVersion);
    }

    public getValue(): string {
        return this.value;
    }

    public getMajor(): number {
        return this.major;
    }

    public getMinor(): number {
        return this.minor;
    }

    public getPatch(): number {
        return this.patch;
    }

    public compareTo(other: SoftwareVersionVO): number {
        if (this.major !== other.major) {
            return this.major > other.major ? 1 : -1;
        }
        if (this.minor !== other.minor) {
            return this.minor > other.minor ? 1 : -1;
        }
        if (this.patch !== other.patch) {
            return this.patch > other.patch ? 1 : -1;
        }
        return 0;
    }

    public isGreaterThan(other: SoftwareVersionVO): boolean {
        return this.compareTo(other) > 0;
    }

    public isLessThan(other: SoftwareVersionVO): boolean {
        return this.compareTo(other) < 0;
    }

    public equals(other: SoftwareVersionVO): boolean {
        return this.compareTo(other) === 0;
    }

    public toString(): string {
        return this.value;
    }
}
