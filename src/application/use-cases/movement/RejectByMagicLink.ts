import { Movement, MovementStatus } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { EstadoActivo } from "../../../domain/entities/Activo";

export class RejectByMagicLink {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository
    ) { }

    async execute(token: string, rejectionReason: string): Promise<Movement> {
        // 1. Buscar el movimiento por token mágico
        const movement = await this.movementRepository.findByMagicLinkToken(token);

        if (!movement) {
            throw new Error('Enlace mágico inválido o expirado.');
        }

        if (movement.status !== 'EN_TRANSIT') {
            throw new Error('Este movimiento no está en tránsito y no puede ser rechazado.');
        }

        if (!rejectionReason || rejectionReason.trim() === '') {
            throw new Error('El motivo del rechazo es obligatorio.');
        }

        // 2. Cancelar el movimiento original y registrar el motivo en notas
        movement.cancel();
        const currentNotes = movement.notes ? `${movement.notes}\n` : '';
        (movement as any).props.notes = `${currentNotes}[NOVEDAD / RECHAZO - MAGIC LINK] Motivo: ${rejectionReason}`;

        await this.movementRepository.update(movement);

        // 3. Crear el movimiento de retorno automático (misma lógica que RejectMovement)
        const returnMovement = new Movement({
            type: 'RETORNO_POR_RECHAZO',
            parentMovementId: movement.id,
            originLocationId: movement.destinationLocationId, // Sale desde donde fue rechazado
            destinationLocationId: movement.originLocationId,  // Vuelve al remitente original
            responsibleId: movement.responsibleId,
            status: MovementStatus.EN_TRANSIT, // Inicia viaje de vuelta inmediatamente
            activoIds: movement.activoIds,
            simCardIds: movement.simCardIds,
            notes: `Retorno automático por rechazo (Magic Link) del traslado #${movement.id!.slice(-6).toUpperCase()}. Motivo: ${rejectionReason}`,
            shippedAt: new Date()
        });

        // 4. Poner los activos en estado RECHAZADO (sin mover ubicación aún, viajan de vuelta)
        const assets = await this.activoRepository.findAll();
        const assetsInMovement = assets.filter(a => movement.activoIds.includes(a.id!));

        for (const activo of assetsInMovement) {
            activo.setStatus(EstadoActivo.RECHAZADO);
            await this.activoRepository.update(activo);
        }

        // 5. Persistir y retornar el movimiento de retorno
        return await this.movementRepository.create(returnMovement);
    }
}
