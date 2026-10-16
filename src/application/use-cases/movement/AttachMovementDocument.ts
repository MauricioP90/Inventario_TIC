import { Movement } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";

export interface AttachMovementDocumentDTO {
    movementId: string;
    documentUrl?: string;
    receivedEvidenceUrl?: string;
    notes?: string;
    uploadedBy?: string;
}

export class AttachMovementDocument {
    constructor(private readonly movementRepository: IMovementRepository) {}

    async execute(dto: AttachMovementDocumentDTO): Promise<Movement> {
        const movement = await this.movementRepository.findById(dto.movementId);
        if (!movement) {
            throw new Error('Movimiento no encontrado');
        }

        // Actualizar documentos en el movimiento
        movement.updateDocuments(dto.documentUrl, dto.receivedEvidenceUrl);

        // Si se proporcionan notas o información de auditoría
        if (dto.notes || dto.uploadedBy) {
            const auditStamp = dto.uploadedBy 
                ? ` [Soporte actualizado por ${dto.uploadedBy} el ${new Date().toLocaleString('es-CO')}]`
                : '';
            const existingNotes = movement.notes || '';
            const newNotesText = dto.notes 
                ? `${existingNotes}\n${dto.notes}${auditStamp}`.trim()
                : `${existingNotes}${auditStamp}`.trim();

            (movement as any).props.notes = newNotesText;
        }

        return await this.movementRepository.update(movement);
    }
}
