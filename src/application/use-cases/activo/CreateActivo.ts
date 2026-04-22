import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { Activo, EstadoActivo } from "../../../domain/entities/Activo";
import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";

// definimos la interface de entrada
interface createActivoInput {
    id: string;
    placa: string;
    tipoActivoId: string;
    marca: string;
    modelo: string;
    serial: string;
    estado: EstadoActivo;
    facturaUrl?: string;
    fechaIngreso: Date;
    locationId: string;
    responsibleId: string;
}


export class CreateActivo {
    // Inyectamos la INTERFAZ del repositorio (Arquitectura Hexagonal pura)
    constructor(
        private readonly activoRepository: IActivoRepository,
        private readonly locationRepository: ILocationRepository,
        private readonly responsibleRepository: IResponsibleRepository
    ) { }

    async execute(input: createActivoInput): Promise<Activo> {

        const activo = new Activo(input);

        // Validar existencia de ubicación y responsable
        const location = await this.locationRepository.findById(input.locationId);
        if (!location) throw new Error('Ubicación no encontrada');

        const responsible = await this.responsibleRepository.findById(input.responsibleId);
        if (!responsible) throw new Error('Responsable no encontrado');

        if (!responsible.locationIds.includes(input.locationId)) {
            throw new Error('Conflicto: El responsable seleccionado no tiene permisos asignados en la sede a la cual está vinculado este activo.');
        }

        const existe = await this.activoRepository.findByPlaca(input.placa);
        const existeSerial = await this.activoRepository.findBySerial(input.serial);

        if (existe) {
            throw new Error('El activo con placa ' + input.placa + ' ya existe');
        }

        if (existeSerial) {
            throw new Error('El activo con serial ' + input.serial + ' ya existe');
        }

        await this.activoRepository.save(activo);
        return activo;
    }

}