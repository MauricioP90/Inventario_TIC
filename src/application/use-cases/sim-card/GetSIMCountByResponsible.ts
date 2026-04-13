import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";

interface GetSIMCountByResponsibleInput {
    responsibleId: string;
}

export class GetSIMCountByResponsible {
    constructor(private readonly simCardRepository: ISIMCardRepository) { }

    async execute(input: GetSIMCountByResponsibleInput): Promise<number> {
        return await this.simCardRepository.countByResponsibleId(input.responsibleId);
    }
}
