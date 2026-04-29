import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'node:crypto';
import { IFileStorageService } from '../../domain/services/IFileStorageService';

export class LocalDiskStorageAdapter implements IFileStorageService {
    private readonly uploadsDir: string;

    constructor() {
        // Los archivos se guardan en /uploads relativo a la raíz del proyecto
        this.uploadsDir = path.join(process.cwd(), 'uploads');
        this.ensureDirectoryExists(this.uploadsDir);
    }

    async uploadBase64(base64Data: string, originalName: string, folder: string): Promise<string> {
        const folderPath = path.join(this.uploadsDir, folder);
        this.ensureDirectoryExists(folderPath);

        // Extraer la extensión del nombre original
        const ext = path.extname(originalName) || '.bin';
        // Generar un nombre único para evitar colisiones
        const uniqueName = `${randomUUID()}${ext}`;
        const filePath = path.join(folderPath, uniqueName);

        // Decodificar Base64 y guardar en disco usando solo módulos nativos de Node
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filePath, buffer);

        // Retornar la URL relativa accesible desde el servidor HTTP
        return `/uploads/${folder}/${uniqueName}`;
    }

    async delete(fileUrl: string): Promise<void> {
        // Convertir la URL relativa a ruta absoluta
        const relativePath = fileUrl.replace('/uploads/', '');
        const filePath = path.join(this.uploadsDir, relativePath);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    private ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
}
