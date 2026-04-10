import { Movement } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";

export class ReceiveMovement {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository
    ) {}

    async execute(id: string): Promise<Movement> {
        // 1. Buscar el movimiento
        const movement = await this.movementRepository.findById(id);
        if (!movement) {
            throw new Error('Movimiento no encontrado');
        }

        // 2. Aplicar lógica de dominio para recibir
        movement.receive();

        // 3. Actualizar la ubicación de todos los activos involucrados
        const assets = await this.activoRepository.findAll(); // En un entorno real usaríamos findByIds
        const assetsInMovement = assets.filter(a => movement.activoIds.includes(a.id!));

        for (const activo of assetsInMovement) {
            activo.changeLocation(movement.destinationLocationId);
            await this.activoRepository.update(activo);
        }

        // 4. Persistir cambios del movimiento
        return await this.movementRepository.update(movement);
    }
}
