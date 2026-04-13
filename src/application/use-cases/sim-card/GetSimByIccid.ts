import { SIMCard } from "../../../domain/entities/SIMCard";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";

interface GetSIMByIccidInput {
    iccid: string;
}

export class GetSIMByIccid {
    constructor(private readonly simCardRepository: ISIMCardRepository) { }

    async execute(input: GetSIMByIccidInput): Promise<SIMCard | null> {
        return await this.simCardRepository.findByIccid(input.iccid);
    }
}
