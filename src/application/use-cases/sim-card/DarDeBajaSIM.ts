import { SIMCard } from "../../../domain/entities/SIMCard";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";

interface DarDeBajaInput {
    id: string;
}

export class DarDeBajaSIM {
    constructor(private readonly simCardRepository: ISIMCardRepository) { }

    async execute(input: DarDeBajaInput): Promise<SIMCard> {
        const simCard = await this.simCardRepository.findById(input.id);
        if (!simCard) throw new Error('SIMCard Inactiva');
        simCard.darDeBajaSIM();
        await this.simCardRepository.save(simCard);
        return simCard;
    }
}