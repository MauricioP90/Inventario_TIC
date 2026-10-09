import { EstadoResponsable, Responsible } from "../../../domain/entities/Responsible";
import { Cargo } from "../../../domain/entities/Cargo";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { IAreaRepository } from "../../../domain/repositories/IAreaRepository";
import { ICargoRepository } from "../../../domain/repositories/ICargoRepository";

interface UpdateResponsibleInput {
    id: string;
    nombre?: string;
    email?: string;
    telefono?: string;
    estado?: EstadoResponsable;
    area?: string;
    cargo?: string | null;
    tipoDocumento?: string;
    numeroDocumento?: string;
    fechaExpedicionDocumento?: string | null;
    direccion?: string;
    locationIds?: string[];
}

export class UpdateResponsible {
    constructor(
        private readonly responsibleRepository: IResponsibleRepository,
        private readonly areaRepository: IAreaRepository,
        private readonly cargoRepository: ICargoRepository
    ) { }

    async execute(input: UpdateResponsibleInput): Promise<Responsible> {
        const responsible = await this.responsibleRepository.findById(input.id);
        if (!responsible) throw new Error('Responsable no encontrado');

        let areaObj = undefined;
        if (input.area) {
            areaObj = await this.areaRepository.findById(input.area);
            if (!areaObj) throw new Error('Área no encontrada');
        }

        let cargoObj: Cargo | null | undefined = undefined;
        if (input.cargo !== undefined) {
            if (input.cargo) {
                const found = await this.cargoRepository.findById(input.cargo);
                if (!found) throw new Error('Cargo no encontrado');
                cargoObj = found;
            } else {
                cargoObj = null;
            }
        }

        const cargoFinal = cargoObj !== undefined ? cargoObj : responsible.cargo;
        if (cargoFinal && cargoFinal.nombre.trim().toUpperCase() === 'CONTRATISTA') {
            const numDoc = input.numeroDocumento !== undefined ? input.numeroDocumento : responsible.numeroDocumento;
            const tipoDoc = input.tipoDocumento !== undefined ? input.tipoDocumento : responsible.tipoDocumento;
            const fechaExp = input.fechaExpedicionDocumento !== undefined ? input.fechaExpedicionDocumento : responsible.fechaExpedicionDocumento;
            const dir = input.direccion !== undefined ? input.direccion : responsible.direccion;

            if (!numDoc || !numDoc.trim()) throw new Error('El número de documento es obligatorio para contratistas');
            if (!tipoDoc || !tipoDoc.trim()) throw new Error('El tipo de documento es obligatorio para contratistas');
            if (!fechaExp) throw new Error('La fecha de expedición del documento es obligatoria para contratistas');
            if (!dir || !dir.trim()) throw new Error('La dirección es obligatoria para contratistas');
        }

        responsible.update({
            nombre: input.nombre,
            email: input.email,
            telefono: input.telefono,
            estado: input.estado,
            area: areaObj,
            tipoDocumento: input.tipoDocumento,
            numeroDocumento: input.numeroDocumento,
            fechaExpedicionDocumento: input.fechaExpedicionDocumento,
            direccion: input.direccion,
            ...(cargoObj !== undefined ? { cargo: cargoObj } : {}),
            locationIds: input.locationIds
        });

        await this.responsibleRepository.update(responsible);
        return responsible;
    }
}
