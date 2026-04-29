import { Movement } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { EstadoActivo } from "../../../domain/entities/Activo";

export class DispatchMovement {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository
    ) { }

    async execute(id: string, evidenceUrl: string): Promise<Movement> {
        // 1. Buscar el movimiento
        const movement = await this.movementRepository.findById(id);
        if (!movement) {
            throw new Error('Movimiento no encontrado');
        }

        // 2. Aplicar lógica de dominio (cambiar a EN_TRANSIT)
        movement.dispatch(evidenceUrl);

        // 3. buscar los activos uno por uno y actualizarlos
        for (const activoId of movement.activoIds) {
            const activo = await this.activoRepository.findById(activoId);
            if (activo) {
                activo.setStatus(EstadoActivo.EN_TRANSIT);
                await this.activoRepository.update(activo);
            }
        }



        // 4. Persistir cambios
        return await this.movementRepository.update(movement);
    }
}
