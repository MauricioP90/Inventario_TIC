import { SIMCard } from "../../../domain/entities/SIMCard";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";

export interface GetAllSIMCardsFilters {
    numero?: string;
    iccid?: string;
}

export class GetAllSIMCards {
    constructor(private readonly simCardRepository: ISIMCardRepository) { }

    async execute(filters?: GetAllSIMCardsFilters): Promise<SIMCard[]> {
        if (filters?.numero) {
            const sim = await this.simCardRepository.findByNumero(filters.numero);
            return sim ? [sim] : [];
        }
        if (filters?.iccid) {
            const sim = await this.simCardRepository.findByIccid(filters.iccid);
            return sim ? [sim] : [];
        }
        return await this.simCardRepository.findAll();
    }
}