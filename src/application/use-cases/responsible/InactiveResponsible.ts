import { EstadoResponsable, Responsible } from "../../../domain/entities/Responsible";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";

interface InactiveResponsibleInput {
    id: string;
}

export class InactiveResponsible {
    constructor(private readonly responsibleRepository: IResponsibleRepository) { }

    // Dentro de InactiveResponsible.ts
    async execute(input: InactiveResponsibleInput): Promise<Responsible> {
        const responsible = await this.responsibleRepository.findById(input.id);
        if (!responsible) throw new Error('Responsable no encontrado');

        // Aquí usas tu descubrimiento:
        responsible.update({ estado: EstadoResponsable.INACTIVO });

        await this.responsibleRepository.update(responsible);
        return responsible;
    }
}
