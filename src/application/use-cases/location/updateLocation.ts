import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { Location } from "../../../domain/entities/Location";
import { EstadoLocation } from "../../../domain/entities/Location";
import { EstadoResponsable } from "../../../domain/entities/Responsible";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";

export interface UpdateLocationInput {
    code: string;
    nombre?: string;
    coordenadas?: string;
    estado?: EstadoLocation;
    responsibleId?: string;
}

export class UpdateLocation {
    constructor(
        private readonly locationRepository: ILocationRepository,
        private readonly responsibleRepository: IResponsibleRepository
    ) { }

    async execute(input: UpdateLocationInput): Promise<Location> {
        // 1. Buscar la ubicación por su código de negocio
        const location = await this.locationRepository.findByCode(input.code);

        if (!location) {
            throw new Error('La ubicacion con codigo ' + input.code + ' no existe');
        }

        // 2. Validar que la ubicación no esté INACTIVA (Regla de negocio)
        if (location.estado === EstadoLocation.INACTIVO) {
            throw new Error('No se puede editar una ubicacion inactiva');
        }

        // 3. Si se está cambiando el responsable, validar que exista y esté activo
        if (input.responsibleId && input.responsibleId !== location.responsibleId) {
            const responsible = await this.responsibleRepository.findById(input.responsibleId);

            if (!responsible) {
                throw new Error('El responsable con id ' + input.responsibleId + ' no existe');
            }

            if (responsible.estado === EstadoResponsable.INACTIVO) {
                throw new Error('El responsable con id ' + input.responsibleId + ' esta inactivo');
            }
        }

        // 3. Actualizar la entidad con los nuevos datos
        location.update({
            nombre: input.nombre,
            coordenadas: input.coordenadas,
            estado: input.estado,
            responsibleId: input.responsibleId
        });

        // 4. Persistir los cambios
        await this.locationRepository.update(location);

        return location;
    }
}