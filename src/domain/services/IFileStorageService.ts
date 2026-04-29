// Puerto de dominio — define el contrato sin importar la tecnología de almacenamiento
export interface IFileStorageService {
    /**
     * Guarda un archivo a partir de su contenido en Base64.
     * @param base64Data Contenido del archivo en Base64 (sin el prefijo data:...)
     * @param originalName Nombre original del archivo (ej: "factura.pdf")
     * @param folder Carpeta lógica donde se guardará (ej: "facturas")
     * @returns URL pública/relativa del archivo guardado
     */
    uploadBase64(base64Data: string, originalName: string, folder: string): Promise<string>;

    /**
     * Elimina un archivo por su URL
     */
    delete(fileUrl: string): Promise<void>;
}
