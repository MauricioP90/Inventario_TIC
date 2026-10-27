import { Repository } from "typeorm";
import { IActivoDocumentHistoryRepository } from "../../../../domain/repositories/IActivoDocumentHistoryRepository";
import { ActivoDocumentHistory } from "../../../../domain/entities/ActivoDocumentHistory";
import { ActivoDocumentHistoryEntity } from "../entities/ActivoDocumentHistoryEntity";

export class TypeORMActivoDocumentHistoryRepository implements IActivoDocumentHistoryRepository {
    constructor(private readonly repository: Repository<ActivoDocumentHistoryEntity>) {}

    async save(history: ActivoDocumentHistory): Promise<ActivoDocumentHistory> {
        const entity = this.repository.create({
            id: history.id,
            activoId: history.activoId,
            previousFacturaUrl: history.previousFacturaUrl,
            newFacturaUrl: history.newFacturaUrl,
            previousPrecioCompra: history.previousPrecioCompra,
            newPrecioCompra: history.newPrecioCompra,
            changedByUser: history.changedByUser,
            justification: history.justification,
            createdAt: history.createdAt,
        });
        const saved = await this.repository.save(entity);
        return this.toDomain(saved);
    }

    async findByActivoId(activoId: string): Promise<ActivoDocumentHistory[]> {
        const entities = await this.repository.find({
            where: { activoId },
            order: { createdAt: 'DESC' }
        });
        return entities.map(e => this.toDomain(e));
    }

    private toDomain(entity: ActivoDocumentHistoryEntity): ActivoDocumentHistory {
        return new ActivoDocumentHistory({
            id: entity.id,
            activoId: entity.activoId,
            previousFacturaUrl: entity.previousFacturaUrl,
            newFacturaUrl: entity.newFacturaUrl,
            previousPrecioCompra: entity.previousPrecioCompra !== undefined && entity.previousPrecioCompra !== null 
                ? Number(entity.previousPrecioCompra) 
                : undefined,
            newPrecioCompra: entity.newPrecioCompra !== undefined && entity.newPrecioCompra !== null 
                ? Number(entity.newPrecioCompra) 
                : undefined,
            changedByUser: entity.changedByUser,
            justification: entity.justification,
            createdAt: entity.createdAt
        });
    }
}
