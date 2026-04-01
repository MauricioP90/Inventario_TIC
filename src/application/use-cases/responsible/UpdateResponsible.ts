import { EstadoResponsable, Responsible } from "../../../domain/entities/Responsible";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";

interface UpdateResponsibleInput {
    id: string;
    nombre?: string;
    email?: string;
    telefono?: string;
    estado?: EstadoResponsable;
    rol?: string;
    locationIds?: string[];
}

export class UpdateResponsible {
    constructor(private readonly responsibleRepository: IResponsibleRepository) { }

    async execute(input: UpdateResponsibleInput): Promise<Responsible> {
        const responsible = await this.responsibleRepository.findById(input.id);
        if (!responsible) throw new Error('Responsable no encontrado');
        
        responsible.update({ 
            nombre: input.nombre, 
            email: input.email, 
            telefono: input.telefono,
            estado: input.estado,
            rol: input.rol,
            locationIds: input.locationIds
        });
        
        await this.responsibleRepository.update(responsible);
        return responsible;
    }
}
