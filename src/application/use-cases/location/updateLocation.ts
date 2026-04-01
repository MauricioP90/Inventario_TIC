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
    responsibleIds?: string[];
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

        // 3. Si se están cambiando los responsables, validar que existan y estén activos
        if (input.responsibleIds && input.responsibleIds.length > 0) {
            for (const id of input.responsibleIds) {
                const responsible = await this.responsibleRepository.findById(id);

                if (!responsible) {
                    throw new Error('El responsable con id ' + id + ' no existe');
                }

                if (responsible.estado === EstadoResponsable.INACTIVO) {
                    throw new Error('El responsable con id ' + id + ' esta inactivo');
                }
            }
        }

        // 3. Actualizar la entidad con los nuevos datos
        location.update({
            nombre: input.nombre,
            coordenadas: input.coordenadas,
            estado: input.estado,
            responsibleIds: input.responsibleIds
        });

        // 4. Persistir los cambios
        await this.locationRepository.update(location);

        return location;
    }
}