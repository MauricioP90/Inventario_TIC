import { IFileStorageService } from '../../domain/services/IFileStorageService';
import { LocalDiskStorageAdapter } from './LocalDiskStorageAdapter';
import { S3StorageAdapter } from './S3StorageAdapter';

export class StorageAdapterFactory {
    private static instance: IFileStorageService;

    public static getAdapter(): IFileStorageService {
        if (!this.instance) {
            const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
            console.log(`📦 Almacenamiento inicializado con proveedor: [${provider.toUpperCase()}]`);

            if (provider === 's3' || provider === 'minio' || provider === 'seaweedfs') {
                this.instance = new S3StorageAdapter();
            } else {
                this.instance = new LocalDiskStorageAdapter();
            }
        }
        return this.instance;
    }
}
