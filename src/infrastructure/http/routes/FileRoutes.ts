import { Router } from 'express';
import { requireRoles } from '../middleware/RoleMiddleware';
import { FileController } from '../controllers/FileController';
import { StorageAdapterFactory } from '../../storage/StorageAdapterFactory';

const fileRouter = Router();

// Instanciar el adaptador mediante Factory según la variable de entorno
const storageAdapter = StorageAdapterFactory.getAdapter();
const fileController = new FileController(storageAdapter);

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Subir un archivo en formato Base64
 *     tags: [Archivos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               base64:
 *                 type: string
 *                 description: Contenido del archivo en Base64
 *               fileName:
 *                 type: string
 *                 description: Nombre original del archivo (ej factura.pdf)
 *               folder:
 *                 type: string
 *                 description: Carpeta destino (opcional, por defecto facturas)
 *     responses:
 *       201:
 *         description: Archivo guardado, devuelve la URL
 */
fileRouter.post('/upload', requireRoles('admin', 'coordinador', 'tecnico', 'auxiliar_inventario'), (req, res) => fileController.upload(req, res));

export { fileRouter };
