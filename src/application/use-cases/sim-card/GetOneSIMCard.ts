import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";
import { SIMCard } from "../../../domain/entities/SIMCard";

interface GetOneSIMCardInput {
    id: string;
}

export class GetOneSIMCard {
    constructor(private readonly simCardRepository: ISIMCardRepository) { }

    async execute(input: GetOneSIMCardInput): Promise<SIMCard> {
        const simCard = await this.simCardRepository.findById(input.id);
        if (!simCard) throw new Error('SIMCard no encontrada');
        return simCard;
    }
}