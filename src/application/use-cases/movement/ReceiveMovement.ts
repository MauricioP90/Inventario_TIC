import { Movement } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";

export class ReceiveMovement {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository
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
        // 5. Persistir cambios del movimiento
        return await this.movementRepository.update(movement);
    }
}
