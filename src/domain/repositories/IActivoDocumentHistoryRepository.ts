import { ActivoDocumentHistory } from "../entities/ActivoDocumentHistory";

export interface IActivoDocumentHistoryRepository {
    save(history: ActivoDocumentHistory): Promise<ActivoDocumentHistory>;
    findByActivoId(activoId: string): Promise<ActivoDocumentHistory[]>;
}
