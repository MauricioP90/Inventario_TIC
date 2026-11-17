import { Request, Response } from 'express';
import { IFileStorageService } from '../../../domain/services/IFileStorageService';
import { FileSecurityValidator } from '../../storage/FileSecurityValidator';

export class FileController {
    constructor(private readonly fileStorage: IFileStorageService) {}

    /**
     * Recibe un archivo en Base64, valida seguridad (10MB, extensiones, Magic Bytes y carpetas) y lo persiste.
     * Body esperado: { base64: string, fileName: string, folder?: string }
     */
    async upload(req: Request, res: Response) {
        try {
            const { base64, fileName, folder = 'facturas' } = req.body;

            const validated = FileSecurityValidator.validateBase64(base64, fileName, folder);

            const url = await this.fileStorage.uploadBase64(
                validated.buffer.toString('base64'),
                fileName,
                validated.sanitizedFolder
            );
            return res.status(201).json({ url });
        } catch (error: any) {
            const isValidationError = error.message?.includes('requerido') ||
                error.message?.includes('permitida') ||
                error.message?.includes('supera el tamaño') ||
                error.message?.includes('firma binaria');

            return res.status(isValidationError ? 400 : 500).json({
                message: error.message || 'Error al guardar el archivo.'
            });
        }
    }
}
