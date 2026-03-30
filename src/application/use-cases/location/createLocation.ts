import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { Location, EstadoLocation } from "../../../domain/entities/Location";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { EstadoResponsable } from "../../../domain/entities/Responsible";

export interface CreateLocationInput {
    id: string;
    code: string;
    nombre: string;
    coordenadas: string;
    estado: EstadoLocation;
    responsibleId: string;
}

export class CreateLocation {
    constructor(private readonly locationRepository: ILocationRepository, private readonly responsibleRepository: IResponsibleRepository) { }

    async execute(input: CreateLocationInput): Promise<Location> {
        const location = new Location(input);

        const existe = await this.locationRepository.findByCode(location.code);
        if (existe) {
            throw new Error('La ubicacion con codigo ' + location.code + ' ya existe');
        }

        if (location.responsibleId) {
            const responsable = await this.responsibleRepository.findById(location.responsibleId);
            if (!responsable) {
                throw new Error('El responsable con id ' + location.responsibleId + ' no existe');
            }
            if (responsable.estado === EstadoResponsable.INACTIVO) {
                throw new Error('El responsable con id ' + location.responsibleId + ' esta inactivo');
            }
        }

        await this.locationRepository.save(location);
        return location;
    }
}