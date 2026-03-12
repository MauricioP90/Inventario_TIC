import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";
import { SIMCard } from "../../../domain/entities/SIMCard";
import { Activo } from "../../../domain/entities/Activo";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";

interface AssignSIMToActivoInput {
    simCardId: string; // El ID de la SIM (que podrías obtener de un click)
    placaActivo: string; // La placa que el usuario digita o escanea
}

export class AssignSIMToActivo {
    constructor(private readonly simCardRepository: ISIMCardRepository, private readonly activoRepository: IActivoRepository) { }

    async execute(input: AssignSIMToActivoInput): Promise<void> {
        const simCard = await this.simCardRepository.findById(input.simCardId);
        // BUSCAMOS POR PLACA, como manda el negocio
        const activo = await this.activoRepository.findByPlaca(input.placaActivo);

        if (!simCard || !activo) throw new Error('SIMCard o Activo no encontrado');
        // Usamos el ID interno para la relación en la base de datos
        simCard.asignarAActivo(activo.id!);

        await this.simCardRepository.save(simCard);
    }
}