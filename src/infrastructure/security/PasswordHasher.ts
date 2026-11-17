import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

export class PasswordHasher {
    private static readonly KEY_LENGTH = 64;

    /**
     * Genera un hash criptográfico en formato: scrypt$<salt_hex>$<hash_hex>
     */
    public static hash(password: string): string {
        const salt = randomBytes(16).toString('hex');
        const derivedKey = scryptSync(password, salt, this.KEY_LENGTH);
        return `scrypt$${salt}$${derivedKey.toString('hex')}`;
    }

    /**
     * Verifica una contraseña en texto plano contra el valor almacenado (hash o legado en texto plano).
     * Utiliza timingSafeEqual para mitigar ataques de temporización (timing attacks).
     */
    public static verify(plainText: string, storedValue: string): boolean {
        if (!plainText || !storedValue) {
            return false;
        }

        if (this.isHashed(storedValue)) {
            const parts = storedValue.split('$');
            if (parts.length !== 3) {
                return false;
            }
            const [, salt, originalHashHex] = parts;
            const originalBuffer = Buffer.from(originalHashHex, 'hex');
            const derivedKey = scryptSync(plainText, salt, originalBuffer.length);
            return timingSafeEqual(originalBuffer, derivedKey);
        }

        // Transición suave: si la base de datos aún tiene una clave legada en texto plano
        const plainBuffer = Buffer.from(plainText, 'utf8');
        const storedBuffer = Buffer.from(storedValue, 'utf8');
        if (plainBuffer.length !== storedBuffer.length) {
            return false;
        }
        return timingSafeEqual(plainBuffer, storedBuffer);
    }

    /**
     * Detecta si una cadena ya tiene formato de hash scrypt
     */
    public static isHashed(value: string): boolean {
        return typeof value === 'string' && value.startsWith('scrypt$');
    }
}

