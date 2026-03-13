import { Responsible } from "../../../domain/entities/Responsible";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";

export class GetAllResponsible {
    constructor(private readonly responsibleRepository: IResponsibleRepository) { }

    async execute(): Promise<Responsible[]> {
        return await this.responsibleRepository.findAll();
    }
}
