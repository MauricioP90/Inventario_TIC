import { Movement } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";

export class ReceiveByMagicLink {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository,
        private readonly simCardRepository: ISIMCardRepository
    ) { }

    async execute(token: string, physicalReceiverName: string): Promise<Movement> {
        // 1. Buscar el movimiento por el token mágico
        const movement = await this.movementRepository.findByMagicLinkToken(token);

        if (!movement) {
            throw new Error('Enlace mágico inválido o expirado.');
        }

        if (movement.status !== 'EN_TRANSIT') {
            throw new Error('Este movimiento no está en tránsito.');
        }

        if (!physicalReceiverName || physicalReceiverName.trim() === '') {
            throw new Error('El nombre de quien recibe es obligatorio.');
        }

        // 2. Cambiar estado y guardar datos de recepción directamente en los props internos.
        // NO se pasa receiverId porque quien recibe no tiene cuenta en el sistema.
        // physicalReceiverName es el único dato de identidad del receptor externo.
        (movement as any).props.status = 'RECEIVED';
        (movement as any).props.receivedAt = new Date();
        (movement as any).props.physicalReceiverName = physicalReceiverName.trim();
        (movement as any).props.magicLinkToken = null; // Consumir el token (un solo uso)
        (movement as any).props.receivedEvidenceUrl = null;

        // 3. Actualizar la ubicación de todos los activos involucrados
        for (const activoId of movement.activoIds) {
            const activo = await this.activoRepository.findById(activoId);
            if (activo) {
                activo.aplicarRecepcionDeMovimiento(movement.type, movement.destinationLocationId);
                await this.activoRepository.update(activo);
            }
        }

        // 4. Actualizar la ubicación de todas las SIM Cards involucradas
        if (movement.simCardIds && movement.simCardIds.length > 0) {
            const sims = await this.simCardRepository.findAll();
            const simsInMovement = sims.filter(s => movement.simCardIds.includes(s.id!));
            for (const sim of simsInMovement) {
                sim.update({ locationId: movement.destinationLocationId });
                await this.simCardRepository.save(sim);
            }
        }

        // 5. Persistir cambios del movimiento
        return await this.movementRepository.update(movement);
    }
}
