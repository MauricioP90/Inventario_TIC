import { EstadoResponsable, Responsible } from "../../../domain/entities/Responsible";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";

interface CreateResponsibleInput {
    nombre: string;
    email: string;
    telefono: string;
    estado: EstadoResponsable;
    rol: string;
    locationIds?: string[];
}

export class CreateResponsible {
    constructor(private readonly responsibleRepository: IResponsibleRepository) { }

    async execute(input: CreateResponsibleInput): Promise<Responsible> {
        const existe = await this.responsibleRepository.findByNombre(input.nombre);
        if (existe) {
            throw new Error('El responsable con nombre ' + input.nombre + ' ya existe');
        }

        const responsible = new Responsible(input);
        await this.responsibleRepository.create(responsible);
        return responsible;
    }
}
