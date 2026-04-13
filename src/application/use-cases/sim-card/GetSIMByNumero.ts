import { SIMCard } from "../../../domain/entities/SIMCard";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";

interface GetSIMByNumeroInput {
    numero: string;
}

export class GetSIMByNumero {
    constructor(private readonly simCardRepository: ISIMCardRepository) { }

    async execute(input: GetSIMByNumeroInput): Promise<SIMCard | null> {
        return await this.simCardRepository.findByNumero(input.numero);
    }
}
