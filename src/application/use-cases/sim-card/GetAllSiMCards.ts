import { SIMCard } from "../../../domain/entities/SIMCard";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";

interface GetAllSIMCardsInput {
}

export class GetAllSIMCards {
    constructor(private readonly simCardRepository: ISIMCardRepository) { }

    async execute(): Promise<SIMCard[]> {
        return await this.simCardRepository.findAll();
    }
}