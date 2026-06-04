import { Movement } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";

export class ReceiveMovement {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository,
        private readonly simCardRepository: ISIMCardRepository
    ) { }

    async execute(id: string, receiverId: string, receiverEvidenceUrl: string, destinationLocationId?: string): Promise<Movement> {
        // 1. Buscar el movimiento
        const movement = await this.movementRepository.findById(id);
        if (!movement) {
            throw new Error('Movimiento no encontrado');
        }
        // 2. Si se suministra una sede destino diferente al recibir, la actualizamos en el movimiento
        if (destinationLocationId && destinationLocationId !== movement.destinationLocationId) {
            movement.changeDestinationLocation(destinationLocationId);
        }
        // 3. Aplicar lógica de dominio para recibir
        movement.receive(receiverId, receiverEvidenceUrl);
        // 4. Actualizar la ubicación de todos los activos involucrados
        const assets = await this.activoRepository.findAll(); // En un entorno real usaríamos findByIds
        const assetsInMovement = assets.filter(a => movement.activoIds.includes(a.id!));
        for (const activo of assetsInMovement) {
            activo.aplicarRecepcionDeMovimiento(movement.type, movement.destinationLocationId);
            await this.activoRepository.update(activo);
        }
        // 5. Actualizar la ubicación de todas las SIM Cards involucradas
        if (movement.simCardIds && movement.simCardIds.length > 0) {
            const sims = await this.simCardRepository.findAll();
            const simsInMovement = sims.filter(s => movement.simCardIds.includes(s.id!));
            for (const sim of simsInMovement) {
                sim.update({ locationId: movement.destinationLocationId });
                await this.simCardRepository.save(sim);
            }
        }
        // 6. Persistir cambios del movimiento
        return await this.movementRepository.update(movement);
    }
}
