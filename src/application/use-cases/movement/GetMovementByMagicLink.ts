import { Movement } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";

export class GetMovementByMagicLink {
    constructor(private readonly movementRepository: IMovementRepository) { }

    async execute(token: string): Promise<Movement> {
        const movement = await this.movementRepository.findByMagicLinkToken(token);

        if (!movement) {
            throw new Error('Enlace de autenticación única inválido o expirado.');
        }

        const ttlHours = Number(process.env.MAGIC_LINK_TTL_HOURS) || 168; // 7 días
        if (movement.isMagicLinkExpired(ttlHours)) {
            throw new Error(`Este enlace de autenticación única ha caducado por superar la vigencia permitida (${Math.round(ttlHours / 24)} días).`);
        }

        if (movement.status !== 'EN_TRANSIT') {
            throw new Error('Este movimiento ya no está disponible para ser recibido.');
        }

        return movement;
    }
}
