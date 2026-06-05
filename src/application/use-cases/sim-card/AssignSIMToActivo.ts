import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { EstadoSIM } from "../../../domain/entities/SIMCard";
import { EstadoActivo } from "../../../domain/entities/Activo";

interface AssignSIMToActivoInput {
    simCardId: string;
    placaActivo: string;
}

export class AssignSIMToActivo {
    constructor(
        private readonly simCardRepository: ISIMCardRepository,
        private readonly activoRepository: IActivoRepository
    ) { }

    async execute(input: AssignSIMToActivoInput): Promise<void> {
        // 1. Buscar entidades
        const simCard = await this.simCardRepository.findById(input.simCardId);
        const activo = await this.activoRepository.findByPlaca(input.placaActivo);

        if (!simCard || !activo) {
            throw new Error('SIM Card o Activo no encontrado');
        }

        // 2. Validaciones de Estado
        if (simCard.estado !== EstadoSIM.BODEGA) {
            throw new Error('La SIM no está disponible (debe estar en BODEGA)');
        }
        if (activo.estado !== EstadoActivo.DISPONIBLE) {
            throw new Error('El activo no está disponible');
        }
        if (simCard.activoId) {
            throw new Error('La SIM ya está asignada a otro activo');
        }

        // 3. Regla de Negocio: Deben estar en la misma ubicación
        if (simCard.locationId && activo.locationId && simCard.locationId !== activo.locationId) {
            throw new Error('No se puede asignar la SIM Card: La SIM Card y el Dispositivo deben estar registrados en la misma sede física.');
        }

        // 4. Mutaciones de estado en el Dominio (esto lanzará error si el activo ya tiene 2 SIMs)
        simCard.asignarAActivo(activo.id!);
        activo.asignarSIMCard(simCard);

        // 5. Persistir cambios
        await this.simCardRepository.save(simCard);
        await this.activoRepository.save(activo);
    }
}