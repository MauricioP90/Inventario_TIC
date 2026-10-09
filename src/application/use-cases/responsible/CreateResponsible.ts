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
    cargo: string;
    tipoDocumento?: string;
    numeroDocumento?: string;
    fechaExpedicionDocumento?: string | null;
    direccion?: string;
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

        if (!input.cargo) {
            throw new Error('El cargo es obligatorio para completar la creación del responsable');
        }

        const cargo = await this.cargoRepository.findById(input.cargo);
        if (!cargo) {
            throw new Error('Cargo no encontrado');
        }

        // Si el cargo es CONTRATISTA, documento, fecha de expedición y dirección son obligatorios
        const esContratista = cargo.nombre.trim().toUpperCase() === 'CONTRATISTA';
        if (esContratista) {
            if (!input.numeroDocumento || !input.numeroDocumento.trim()) {
                throw new Error('El número de documento es obligatorio para contratistas');
            }
            if (!input.tipoDocumento || !input.tipoDocumento.trim()) {
                throw new Error('El tipo de documento es obligatorio para contratistas');
            }
            if (!input.fechaExpedicionDocumento) {
                throw new Error('La fecha de expedición del documento es obligatoria para contratistas');
            }
            if (!input.direccion || !input.direccion.trim()) {
                throw new Error('La dirección es obligatoria para contratistas');
            }
        }

        let area = undefined;
        if (input.area) {
            area = await this.areaRepository.findById(input.area);
            if (!area) throw new Error('Área no encontrada');
        }

        const responsible = new Responsible({
            nombre: input.nombre,
            email: input.email,
            telefono: input.telefono,
            estado: input.estado,
            tipoDocumento: input.tipoDocumento || 'CC',
            numeroDocumento: input.numeroDocumento || undefined,
            fechaExpedicionDocumento: input.fechaExpedicionDocumento || undefined,
            direccion: input.direccion || undefined,
            area: area || undefined,
            cargo: cargo,
            locationIds: input.locationIds
        });

        await this.responsibleRepository.create(responsible);
        return responsible;
    }
}