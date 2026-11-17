import * as path from 'path';

export interface ValidatedFile {
    buffer: Buffer;
    cleanExtension: string;
    sanitizedFolder: string;
}

export class FileSecurityValidator {
    public static readonly MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB exactos
    public static readonly ALLOWED_FOLDERS = ['facturas', 'actas', 'soportes', 'evidencias', 'mantenimientos'];
    public static readonly ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];

    /**
     * Valida tamaño, carpeta, extensión y firma binaria (Magic Bytes) de un archivo Base64.
     */
    public static validateBase64(base64Data: string, originalFileName: string, targetFolder: string = 'facturas'): ValidatedFile {
        if (!base64Data || typeof base64Data !== 'string') {
            throw new Error('El contenido del archivo en Base64 es requerido.');
        }

        if (!originalFileName || typeof originalFileName !== 'string') {
            throw new Error('El nombre original del archivo es requerido.');
        }

        // 1. Sanitizar y validar carpeta destino contra lista blanca (Anti-Path Traversal)
        const sanitizedFolder = path.basename(targetFolder.trim().toLowerCase());
        if (!this.ALLOWED_FOLDERS.includes(sanitizedFolder)) {
            throw new Error(`Carpeta de destino no autorizada. Carpetas permitidas: [${this.ALLOWED_FOLDERS.join(', ')}].`);
        }

        // 2. Extraer y validar extensión
        const ext = path.extname(originalFileName).toLowerCase();
        if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
            throw new Error(`Extensión "${ext}" no permitida. Solo se admiten: [${this.ALLOWED_EXTENSIONS.join(', ')}].`);
        }

        // 3. Limpiar prefijo data:mime;base64, si estuviese presente
        const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const buffer = Buffer.from(cleanBase64, 'base64');

        // 4. Validar tamaño máximo
        if (buffer.length === 0) {
            throw new Error('El archivo está vacío.');
        }

        if (buffer.length > this.MAX_FILE_SIZE_BYTES) {
            throw new Error(`El archivo supera el tamaño máximo permitido de 10 MB (Tamaño actual: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`);
        }

        // 5. Validar firma binaria real (Magic Bytes) para impedir scripts o binarios disfrazados
        const isValidSignature = this.verifyMagicBytes(buffer, ext);
        if (!isValidSignature) {
            throw new Error(`La firma binaria del archivo no coincide con un formato válido ${ext.toUpperCase()}. Archivo potencialmente malicioso o corrupto.`);
        }

        return {
            buffer,
            cleanExtension: ext,
            sanitizedFolder
        };
    }

    /**
     * Verifica los Magic Bytes del encabezado del archivo
     */
    private static verifyMagicBytes(buffer: Buffer, extension: string): boolean {
        if (buffer.length < 4) return false;

        // PDF: %PDF- (0x25 0x50 0x44 0x46)
        if (extension === '.pdf') {
            return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
        }

        // PNG: 0x89 0x50 0x4E 0x47 (0x89 'PNG')
        if (extension === '.png') {
            return buffer.length >= 8 &&
                buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
        }

        // JPEG: 0xFF 0xD8 0xFF
        if (extension === '.jpg' || extension === '.jpeg') {
            return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
        }

        // WEBP: RIFF....WEBP
        if (extension === '.webp') {
            if (buffer.length < 12) return false;
            const riff = buffer.subarray(0, 4).toString('ascii');
            const webp = buffer.subarray(8, 12).toString('ascii');
            return riff === 'RIFF' && webp === 'WEBP';
        }

        return false;
    }
}

