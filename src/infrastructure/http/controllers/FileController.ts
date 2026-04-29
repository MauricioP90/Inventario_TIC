import { Request, Response } from 'express';
import { IFileStorageService } from '../../../domain/services/IFileStorageService';

export class FileController {
    constructor(private readonly fileStorage: IFileStorageService) {}

    /**
     * Recibe un archivo en Base64 y lo guarda en disco.
     * Body esperado: { base64: string, fileName: string, folder?: string }
     */
    async upload(req: Request, res: Response) {
        try {
            const { base64, fileName, folder = 'facturas' } = req.body;

            if (!base64 || !fileName) {
                return res.status(400).json({ message: 'Se requieren los campos base64 y fileName.' });
            }

            // El cliente puede enviar el prefijo "data:application/pdf;base64," — lo removemos
            const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;

            const url = await this.fileStorage.uploadBase64(cleanBase64, fileName, folder);
            return res.status(201).json({ url });
        } catch (error: any) {
            return res.status(500).json({ message: 'Error al guardar el archivo: ' + error.message });
        }
    }
}
