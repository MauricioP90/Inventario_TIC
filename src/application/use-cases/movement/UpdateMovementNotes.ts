import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { Movement } from "../../../domain/entities/Movement";

export class UpdateMovementNotes {
    constructor(private movementRepository: IMovementRepository) {}

    async execute(id: string, notes: string): Promise<Movement> {
        const movement = await this.movementRepository.findById(id);
        if (!movement) {
            throw new Error("Movimiento no encontrado");
        }

        // Actualizamos las notas del movimiento
        (movement as any).props.notes = notes;
        return await this.movementRepository.update(movement);
    }
}
