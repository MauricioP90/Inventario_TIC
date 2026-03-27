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
    responsableId: string;
}

export class CreateLocation {
    constructor(private readonly locationRepository: ILocationRepository, private readonly responsibleRepository: IResponsibleRepository) { }

    async execute(input: CreateLocationInput): Promise<Location> {
        const location = new Location(input);

        const existe = await this.locationRepository.findByCode(location.code);
        if (existe) {
            throw new Error('La ubicacion con codigo ' + location.code + ' ya existe');
        }

        if (location.responsableId) {
            const responsable = await this.responsibleRepository.findById(location.responsableId);
            if (!responsable) {
                throw new Error('El responsable con id ' + location.responsableId + ' no existe');
            }
            if (responsable.estado === EstadoResponsable.INACTIVO) {
                throw new Error('El responsable con id ' + location.responsableId + ' esta inactivo');
            }
        }

        await this.locationRepository.save(location);
        return location;
    }
}