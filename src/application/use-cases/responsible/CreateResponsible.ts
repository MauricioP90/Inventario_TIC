import { EstadoResponsable, Responsible } from "../../../domain/entities/Responsible";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { IRoleRepository } from "../../../domain/repositories/IRoleRepository";
import { IAreaRepository } from "../../../domain/repositories/IAreaRepository";

interface CreateResponsibleInput {
    nombre: string;
    email: string;
    telefono: string;
    estado: EstadoResponsable;
    role: string;
    area?: string;
    locationIds?: string[];
}

export class CreateResponsible {
    constructor(
        private readonly responsibleRepository: IResponsibleRepository,
        private readonly roleRepository: IRoleRepository,
        private readonly areaRepository: IAreaRepository
    ) { }

    async execute(input: CreateResponsibleInput): Promise<Responsible> {
        const existe = await this.responsibleRepository.findByNombre(input.nombre);
        if (existe) {
            throw new Error('El responsable con nombre ' + input.nombre + ' ya existe');
        }

        const role = await this.roleRepository.findById(input.role);
        if (!role) throw new Error('Rol no encontrado');

        let area = undefined;
        if (input.area) {
            area = await this.areaRepository.findById(input.area);
            if (!area) throw new Error('Área no encontrada');
        }

        const responsible = new Responsible({
            nombre: input.nombre,
            email: input.email,
            telefono: input.telefono,
            estado: input.estado,
            role: role,
            area: area || undefined,
            locationIds: input.locationIds
        });

        await this.responsibleRepository.create(responsible);
        return responsible;
    }
}