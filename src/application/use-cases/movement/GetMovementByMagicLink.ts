import { Movement } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";

export class GetMovementByMagicLink {
    constructor(private readonly movementRepository: IMovementRepository) { }

    async execute(token: string): Promise<Movement> {
        const movement = await this.movementRepository.findByMagicLinkToken(token);

        if (!movement) {
            throw new Error('Enlace mágico inválido o expirado.');
        }

        if (movement.status !== 'EN_TRANSIT') {
            throw new Error('Este movimiento ya no está disponible para ser recibido.');
        }

        return movement;
    }
}
