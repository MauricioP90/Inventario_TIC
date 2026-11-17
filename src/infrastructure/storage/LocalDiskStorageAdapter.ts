import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'node:crypto';
import { IFileStorageService } from '../../domain/services/IFileStorageService';

export class LocalDiskStorageAdapter implements IFileStorageService {
    private readonly uploadsDir: string;

    constructor() {
        // Los archivos se guardan en /uploads relativo a la raíz del proyecto
        this.uploadsDir = path.resolve(process.cwd(), 'uploads');
        this.ensureDirectoryExists(this.uploadsDir);
    }

    async uploadBase64(base64Data: string, originalName: string, folder: string): Promise<string> {
        const cleanFolder = path.basename(folder.trim().toLowerCase());
        const folderPath = path.resolve(this.uploadsDir, cleanFolder);

        // Prevenir Path Traversal garantizando que la ruta esté estrictamente contenida en uploads
        if (!folderPath.startsWith(this.uploadsDir)) {
            throw new Error('Intento de Path Traversal bloqueado.');
        }

        this.ensureDirectoryExists(folderPath);

        // Extraer la extensión del nombre original
        const ext = path.extname(originalName) || '.bin';
        // Generar un nombre único para evitar colisiones
        const uniqueName = `${randomUUID()}${ext}`;
        const filePath = path.join(folderPath, uniqueName);

        // Decodificar Base64 y guardar en disco
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filePath, buffer);

        // Retornar la URL relativa accesible desde el servidor HTTP
        return `/uploads/${cleanFolder}/${uniqueName}`;
    }

    async delete(fileUrl: string): Promise<void> {
        const cleanRelative = path.normalize(fileUrl.replace('/uploads/', '')).replace(/^(\.\.[\/\\])+/, '');
        const filePath = path.resolve(this.uploadsDir, cleanRelative);

        if (!filePath.startsWith(this.uploadsDir)) {
            throw new Error('Intento de Path Traversal bloqueado al eliminar archivo.');
        }

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    async getSignedUrl(fileUrl: string): Promise<string> {
        return fileUrl;
    }

    private ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
}
