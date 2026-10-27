import { ActivoDocumentHistory } from "../../../domain/entities/ActivoDocumentHistory";
import { IActivoDocumentHistoryRepository } from "../../../domain/repositories/IActivoDocumentHistoryRepository";

export interface GetActivoDocumentHistoryInput {
    activoId: string;
}

export class GetActivoDocumentHistory {
    constructor(
        private readonly documentHistoryRepository: IActivoDocumentHistoryRepository
    ) { }

    async execute(input: GetActivoDocumentHistoryInput): Promise<ActivoDocumentHistory[]> {
        if (!input.activoId) {
            throw new Error('El ID del activo es obligatorio para consultar el historial de auditoría.');
        }
        return await this.documentHistoryRepository.findByActivoId(input.activoId);
    }
}
