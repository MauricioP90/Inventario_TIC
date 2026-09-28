import { EstadoResponsable, Responsible } from "../../../domain/entities/Responsible";
import { Cargo } from "../../../domain/entities/Cargo";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { IAreaRepository } from "../../../domain/repositories/IAreaRepository";
import { ICargoRepository } from "../../../domain/repositories/ICargoRepository";

interface UpdateResponsibleInput {
    id: string;
    nombre?: string;
    email?: string;
    telefono?: string;
    estado?: EstadoResponsable;
    area?: string;
    cargo?: string | null;
    locationIds?: string[];
}

export class UpdateResponsible {
    constructor(
        private readonly responsibleRepository: IResponsibleRepository,
        private readonly areaRepository: IAreaRepository,
        private readonly cargoRepository: ICargoRepository
    ) { }

    async execute(input: UpdateResponsibleInput): Promise<Responsible> {
        const responsible = await this.responsibleRepository.findById(input.id);
        if (!responsible) throw new Error('Responsable no encontrado');

        let areaObj = undefined;
        if (input.area) {
            areaObj = await this.areaRepository.findById(input.area);
            if (!areaObj) throw new Error('Área no encontrada');
        }

        let cargoObj: Cargo | null | undefined = undefined;
        if (input.cargo !== undefined) {
            if (input.cargo) {
                const found = await this.cargoRepository.findById(input.cargo);
                if (!found) throw new Error('Cargo no encontrado');
                cargoObj = found;
            } else {
                cargoObj = null;
            }
        }

        responsible.update({
            nombre: input.nombre,
            email: input.email,
            telefono: input.telefono,
            estado: input.estado,
            area: areaObj,
            ...(cargoObj !== undefined ? { cargo: cargoObj } : {}),
            locationIds: input.locationIds
        });

        await this.responsibleRepository.update(responsible);
        return responsible;
    }
}
