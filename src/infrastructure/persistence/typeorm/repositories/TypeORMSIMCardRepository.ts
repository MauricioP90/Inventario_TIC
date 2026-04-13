import { Repository } from "typeorm";
import { SIMCard } from "../../../../domain/entities/SIMCard";
import { ISIMCardRepository } from "../../../../domain/repositories/ISIMCardRepository";
import { SIMCardEntity } from "../entities/SIMCardEntity";
import { SIMCardMapper } from "../../mappers/SIMCardMapper";

export class TypeORMSIMCardRepository implements ISIMCardRepository {
    constructor(private readonly repository: Repository<SIMCardEntity>) { }

    async save(simCard: SIMCard): Promise<void> {
        const entity = SIMCardMapper.toPersistence(simCard);
        await this.repository.save(entity);
    }
    async findById(id: string): Promise<SIMCard | null> {
        const entity = await this.repository.findOne({ where: { id }, relations: ['activo'] });
        return entity ? SIMCardMapper.toDomain(entity) : null;
    }
    async findByNumero(numero: string): Promise<SIMCard | null> {
        const entity = await this.repository.findOne({ where: { numero }, relations: ['activo'] });
        return entity ? SIMCardMapper.toDomain(entity) : null;
    }
    async findAll(): Promise<SIMCard[]> {
        const entities = await this.repository.find({ relations: ['activo'] });
        return entities.map(entity => SIMCardMapper.toDomain(entity));
    }
    async findByIccid(iccid: string): Promise<SIMCard | null> {
        const entity = await this.repository.findOne({ where: { iccid }, relations: ['activo'] });
        return entity ? SIMCardMapper.toDomain(entity) : null;
    }
    async countByResponsibleId(responsibleId: string): Promise<number> {
        return await this.repository.createQueryBuilder("sim")
            .innerJoin("sim.activo", "activo")
            .where("activo.responsibleId = :responsibleId", { responsibleId })
            .getCount();
    }
    async assignSimCard(simCard: SIMCard): Promise<void> {
        const entity = SIMCardMapper.toPersistence(simCard);
        await this.repository.save(entity);
    }
    async darDeBajaSIM(simCard: SIMCard): Promise<void> {
        const entity = SIMCardMapper.toPersistence(simCard);
        await this.repository.save(entity);
    }
}