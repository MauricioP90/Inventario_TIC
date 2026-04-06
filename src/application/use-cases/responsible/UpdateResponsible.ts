import { EstadoResponsable, Responsible } from "../../../domain/entities/Responsible";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { IRoleRepository } from "../../../domain/repositories/IRoleRepository";

interface UpdateResponsibleInput {
    id: string;
    nombre?: string;
    email?: string;
    telefono?: string;
    estado?: EstadoResponsable;
    role?: string;
    locationIds?: string[];
}

export class UpdateResponsible {
    constructor(private readonly responsibleRepository: IResponsibleRepository, private readonly roleRepository: IRoleRepository) { }

    async execute(input: UpdateResponsibleInput): Promise<Responsible> {
        const responsible = await this.responsibleRepository.findById(input.id);
        if (!responsible) throw new Error('Responsable no encontrado');

        let roleObj = undefined;

        if (input.role) {
            roleObj = await this.roleRepository.findById(input.role);
            if (!roleObj) throw new Error('Rol no encontrado');
        }

        responsible.update({
            nombre: input.nombre,
            email: input.email,
            telefono: input.telefono,
            estado: input.estado,
            role: roleObj,
            locationIds: input.locationIds
        });

        await this.responsibleRepository.update(responsible);
        return responsible;
    }
}
