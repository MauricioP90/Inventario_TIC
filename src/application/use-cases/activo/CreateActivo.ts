import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { Activo, EstadoActivo } from "../../../domain/entities/Activo";
import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";

// definimos la interface de entrada
interface createActivoInput {
    id?: string; // Ahora es opcional
    placa: string;
    tipoActivoId: string;
    marca: string;
    modelo: string;
    serial: string;
    estado: EstadoActivo;
    facturaUrl?: string;
    fechaIngreso: Date | string; // Aceptamos string para parsear
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
        // Aseguramos que la fecha sea un objeto Date
        const fechaParseada = typeof input.fechaIngreso === 'string' 
            ? new Date(input.fechaIngreso) 
            : input.fechaIngreso;

        const activo = new Activo({
            ...input,
            id: input.id,
            fechaIngreso: fechaParseada
        });

        // Validar existencia de ubicación y responsable
        const location = await this.locationRepository.findById(input.locationId);
        if (!location) throw new Error('Ubicación no encontrada');

        const responsible = await this.responsibleRepository.findById(input.responsibleId);
        if (!responsible) throw new Error('Responsable no encontrado');

        // Validación estricta: el responsable debe tener permisos en la sede seleccionada
        if (!responsible.locationIds.includes(input.locationId)) {
            throw new Error(
                `El responsable "${responsible.nombre}" no tiene permisos asignados en la sede seleccionada. ` +
                `Por favor asigne al responsable a esa sede desde el módulo de Responsables, o elija otro responsable.`
            );
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