import { Responsible } from "../../../domain/entities/Responsible";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";

interface GetOneResponsibleInput {
    id: string;
}

export class GetOneResponsible {
    constructor(private readonly responsibleRepository: IResponsibleRepository) { }

    async execute(input: GetOneResponsibleInput): Promise<Responsible> {
        const responsible = await this.responsibleRepository.findById(input.id);
        if (!responsible) throw new Error('Responsable no encontrado');
        return responsible;
    }
}