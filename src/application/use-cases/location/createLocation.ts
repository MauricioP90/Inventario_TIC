import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { Location, EstadoLocation, TipoLocation } from "../../../domain/entities/Location";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { IAreaRepository } from "../../../domain/repositories/IAreaRepository";
import { EstadoResponsable } from "../../../domain/entities/Responsible";
import { Coordinates } from "../../../domain/value-objects/Coordinates";
import { Area } from "../../../domain/entities/Area";

export interface CreateLocationInput {
    id?: string;
    code: string;
    nombre: string;
    coordenadas?: string;
    tipo?: TipoLocation;
    estado: EstadoLocation;
    responsibleIds: string[];
    areaIds?: string[];
    observaciones?: string;
}

export class CreateLocation {
    constructor(
        private readonly locationRepository: ILocationRepository,
        private readonly responsibleRepository: IResponsibleRepository,
        private readonly areaRepository: IAreaRepository
    ) { }

    async execute(input: CreateLocationInput): Promise<Location> {
        if (input.coordenadas && input.coordenadas.trim() !== '' && input.coordenadas.trim() !== '0') {
            Coordinates.fromString(input.coordenadas);
        }

        const areas: Area[] = [];
        if (input.areaIds && input.areaIds.length > 0) {
            for (const areaId of input.areaIds) {
                const area = await this.areaRepository.findById(areaId);
                if (!area) {
                    throw new Error('El area con id ' + areaId + ' no existe');
                }
                areas.push(area);
            }
        }

        const location = new Location({
            id: input.id,
            code: input.code,
            nombre: input.nombre,
            coordenadas: input.coordenadas,
            tipo: input.tipo,
            estado: input.estado,
            responsibleIds: input.responsibleIds,
            areas: areas,
            observaciones: input.observaciones
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