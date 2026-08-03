import { 
    S3Client, 
    PutObjectCommand, 
    DeleteObjectCommand, 
    GetObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import * as path from 'path';
import { IFileStorageService } from '../../domain/services/IFileStorageService';

export class S3StorageAdapter implements IFileStorageService {
    private client: S3Client;
    private bucket: string;
    private publicUrl: string;

    constructor() {
        const endpoint = process.env.FILE_STORAGE_ENDPOINT || 'http://localhost:9000';
        const accessKeyId = process.env.FILE_STORAGE_ACCESS_KEY || 'minioadmin';
        const secretAccessKey = process.env.FILE_STORAGE_SECRET_KEY || 'minioadmin';
        const region = process.env.FILE_STORAGE_REGION || 'us-east-1';
        const forcePathStyle = process.env.FILE_STORAGE_FORCE_PATH_STYLE !== 'false'; // Requerido para MinIO / SeaweedFS

        this.bucket = process.env.FILE_STORAGE_BUCKET || 'inventario-docs';
        this.publicUrl = process.env.FILE_STORAGE_PUBLIC_URL || `${endpoint}/${this.bucket}`;

        this.client = new S3Client({
            endpoint,
            region,
            credentials: {
                accessKeyId,
                secretAccessKey
            },
            forcePathStyle
        });
    }

    async uploadBase64(base64Data: string, originalName: string, folder: string): Promise<string> {
        // Limpiar prefijo data:image/...;base64, si estuviese presente
        const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const buffer = Buffer.from(cleanBase64, 'base64');

        const ext = path.extname(originalName) || '.bin';
        const uniqueName = `${randomUUID()}${ext}`;
        const key = `${folder}/${uniqueName}`;

        const contentType = this.getContentType(ext);

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType
        });

        await this.client.send(command);

        // Devolver la URL pública del objeto en S3 / MinIO
        return `${this.publicUrl}/${key}`;
    }

    async delete(fileUrl: string): Promise<void> {
        // Extraer la Key de la URL completa (ej: http://localhost:9000/inventario-docs/facturas/xxx.pdf -> facturas/xxx.pdf)
        const key = this.extractKeyFromUrl(fileUrl);
        if (!key) return;

        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key
        });

        await this.client.send(command);
    }

    async getSignedUrl(fileUrlOrKey: string, expiresInSeconds: number = 3600): Promise<string> {
        const key = this.extractKeyFromUrl(fileUrlOrKey) || fileUrlOrKey;

        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key
        });

        return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
    }

    private extractKeyFromUrl(url: string): string | null {
        try {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return url.startsWith('/') ? url.substring(1) : url;
            }
            const parsedUrl = new URL(url);
            // pathname es ej: /inventario-docs/facturas/abc.pdf
            const segments = parsedUrl.pathname.split('/').filter(Boolean);
            if (segments.length > 1 && segments[0] === this.bucket) {
                return segments.slice(1).join('/');
            }
            return segments.join('/');
        } catch {
            return null;
        }
    }

    private getContentType(extension: string): string {
        const mimeTypes: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.txt': 'text/plain'
        };
        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    }
}
