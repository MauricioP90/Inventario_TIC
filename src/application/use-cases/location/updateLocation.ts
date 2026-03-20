import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { Location } from "../../../domain/entities/Location";
import { EstadoLocation } from "../../../domain/entities/Location";
import { EstadoResponsable } from "../../../domain/entities/Responsible";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";

export interface UpdateLocationInput {
    code: string;
    nombre?: string;
    direccion?: string;
    estado?: EstadoLocation;
    responsableId?: string;
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

        // 2. Si se está cambiando el responsable, validar que exista y esté activo
        if (input.responsableId && input.responsableId !== location.responsableId) {
            const responsible = await this.responsibleRepository.findById(input.responsableId);

            if (!responsible) {
                throw new Error('El responsable con id ' + input.responsableId + ' no existe');
            }

            if (responsible.estado === EstadoResponsable.INACTIVO) {
                throw new Error('El responsable con id ' + input.responsableId + ' esta inactivo');
            }
        }

        // 3. Actualizar la entidad con los nuevos datos
        location.update({
            nombre: input.nombre,
            direccion: input.direccion,
            estado: input.estado,
            responsableId: input.responsableId
        });

        // 4. Persistir los cambios
        await this.locationRepository.update(location);

        return location;
    }
}