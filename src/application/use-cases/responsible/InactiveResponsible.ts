import { EstadoResponsable, Responsible } from "../../../domain/entities/Responsible";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";

interface InactiveResponsibleInput {
    id: string;
}

export class InactiveResponsible {
    constructor(private readonly responsibleRepository: IResponsibleRepository, private readonly activoRepository: IActivoRepository, private readonly locationRepository: ILocationRepository) { }

    // Dentro de InactiveResponsible.ts
    async execute(input: InactiveResponsibleInput): Promise<Responsible> {
        const responsible = await this.responsibleRepository.findById(input.id);
        if (!responsible) throw new Error('Responsable no encontrado');

        responsible.update({ estado: EstadoResponsable.INACTIVO });

        const activos = await this.activoRepository.countByResponsibleId(input.id);
        const locations = await this.locationRepository.countByResponsibleId(input.id);

        if (activos > 0 || locations > 0) {
            throw new Error('El responsable tiene activos u oficinas asignadas');
        }
        responsible.update({ estado: EstadoResponsable.INACTIVO });
        await this.responsibleRepository.update(responsible);
        return responsible;
    }
}
