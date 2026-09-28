import { EstadoResponsable, Responsible } from "../../../domain/entities/Responsible";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { IAreaRepository } from "../../../domain/repositories/IAreaRepository";
import { ICargoRepository } from "../../../domain/repositories/ICargoRepository";

interface CreateResponsibleInput {
    nombre: string;
    email: string;
    telefono: string;
    estado: EstadoResponsable;
    area?: string;
    cargo?: string;
    locationIds?: string[];
}

export class CreateResponsible {
    constructor(
        private readonly responsibleRepository: IResponsibleRepository,
        private readonly areaRepository: IAreaRepository,
        private readonly cargoRepository: ICargoRepository
    ) { }

    async execute(input: CreateResponsibleInput): Promise<Responsible> {
        const existe = await this.responsibleRepository.findByNombre(input.nombre);
        if (existe) {
            throw new Error('El responsable con nombre ' + input.nombre + ' ya existe');
        }

        let area = undefined;
        if (input.area) {
            area = await this.areaRepository.findById(input.area);
            if (!area) throw new Error('Área no encontrada');
        }

        let cargo = undefined;
        if (input.cargo) {
            cargo = await this.cargoRepository.findById(input.cargo);
            if (!cargo) throw new Error('Cargo no encontrado');
        }

        const responsible = new Responsible({
            nombre: input.nombre,
            email: input.email,
            telefono: input.telefono,
            estado: input.estado,
            area: area || undefined,
            cargo: cargo || undefined,
            locationIds: input.locationIds
        });

        await this.responsibleRepository.create(responsible);
        return responsible;
    }
}