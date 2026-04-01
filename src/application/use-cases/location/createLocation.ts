import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { Location, EstadoLocation } from "../../../domain/entities/Location";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { EstadoResponsable } from "../../../domain/entities/Responsible";

export interface CreateLocationInput {
    id?: string;
    code: string;
    nombre: string;
    coordenadas?: string;
    estado: EstadoLocation;
    responsibleIds: string[];
}

export class CreateLocation {
    constructor(private readonly locationRepository: ILocationRepository, private readonly responsibleRepository: IResponsibleRepository) { }

    async execute(input: CreateLocationInput): Promise<Location> {
        const location = new Location({
            id: input.id,
            code: input.code,
            nombre: input.nombre,
            coordenadas: input.coordenadas,
            estado: input.estado,
            responsibleIds: input.responsibleIds
        });

        const existe = await this.locationRepository.findByCode(location.code);
        if (existe) {
            throw new Error('La ubicacion con codigo ' + location.code + ' ya existe');
        }

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

        await this.locationRepository.save(location);
        return location;
    }
}