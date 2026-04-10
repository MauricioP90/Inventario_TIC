import { Movement } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";

export class DispatchMovement {
    constructor(private readonly movementRepository: IMovementRepository) {}

    async execute(id: string): Promise<Movement> {
        // 1. Buscar el movimiento
        const movement = await this.movementRepository.findById(id);
        if (!movement) {
            throw new Error('Movimiento no encontrado');
        }

        // 2. Aplicar lógica de dominio (cambiar a EN_TRANSIT)
        movement.dispatch();

        // 3. Persistir cambios
        return await this.movementRepository.update(movement);
    }
}
