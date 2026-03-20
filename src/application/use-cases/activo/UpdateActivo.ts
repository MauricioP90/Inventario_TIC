import { Activo, EstadoActivo } from "../../../domain/entities/Activo";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { Responsible } from "../../../domain/entities/Responsible";
import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";

interface UpdateActivoInput {
    placa: string;
    estado?: EstadoActivo;
    facturaUrl?: string;
    locationId?: string;
    responsibleId?: string;
}

export class UpdateActivo {
    constructor(
        private readonly activoRepository: IActivoRepository,
        private readonly locationRepository: ILocationRepository,
        private readonly responsibleRepository: IResponsibleRepository
    ) { }

    async execute(input: UpdateActivoInput): Promise<Activo> {
        const { id } = await this.activoRepository.findByPlaca(input.placa) || {};
        const activo = await this.activoRepository.findByPlaca(input.placa);
        if (!activo) throw new Error('Activo no encontrado');

        if (input.locationId) {
            const location = await this.locationRepository.findById(input.locationId);
            if (!location) throw new Error('Ubicación no encontrada');
            activo.asignarUbicacion(location);
        }

        if (input.responsibleId) {
            const responsible = await this.responsibleRepository.findById(input.responsibleId);
            if (!responsible) throw new Error('Responsable no encontrado');
            activo.asignarResponsable(responsible);
        }

        if (input.estado || input.facturaUrl) {
            activo.update({
                estado: input.estado,
                facturaUrl: input.facturaUrl
            });
        }
        await this.activoRepository.save(activo);
        return activo;
    }
}