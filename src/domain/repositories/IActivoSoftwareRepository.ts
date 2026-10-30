import { ActivoSoftwareHistory } from "../entities/ActivoSoftwareHistory";

export interface IActivoSoftwareRepository {
    save(history: ActivoSoftwareHistory): Promise<void>;
    findById(id: string): Promise<ActivoSoftwareHistory | null>;
    findActiveByActivoId(activoId: string): Promise<ActivoSoftwareHistory[]>;
    findHistoryByActivoId(activoId: string): Promise<ActivoSoftwareHistory[]>;
    findActiveByActivoAndAppId(activoId: string, softwareAppId: string): Promise<ActivoSoftwareHistory | null>;
    update(history: ActivoSoftwareHistory): Promise<ActivoSoftwareHistory>;
}
