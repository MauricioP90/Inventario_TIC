import { Movement, MovementStatus } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { EstadoActivo } from "../../../domain/entities/Activo";

export class RejectMovement {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository
    ) { }

    async execute(id: string, rejectionReason: string): Promise<Movement> {
        // 1. Buscar el movimiento original
        const movement = await this.movementRepository.findById(id);
        if (!movement) {
            throw new Error('Movimiento no encontrado');
        }

        if (movement.status !== 'EN_TRANSIT') {
            throw new Error('Solo se pueden rechazar movimientos que estén en tránsito');
        }

        if (movement.type === 'RETORNO_POR_RECHAZO') {
            throw new Error('Un retorno por rechazo no puede ser rechazado nuevamente. Debe ser recibido obligatoriamente.');
        }

        // 2. Aplicar lógica de dominio para rechazar (usamos cancel() de dominio)
        movement.cancel();
        
        // Registrar el motivo de rechazo en las notas
        const currentNotes = movement.notes ? `${movement.notes}\n` : '';
        (movement as any).props.notes = `${currentNotes}[NOVEDAD / RECHAZO] Motivo: ${rejectionReason}`;

        // Guardar el movimiento cancelado
        await this.movementRepository.update(movement);

        // 3. Crear el nuevo movimiento de retorno
        const returnMovement = new Movement({
            type: 'RETORNO_POR_RECHAZO',
            parentMovementId: movement.id, // Enlace de trazabilidad
            originLocationId: movement.destinationLocationId, // Sale desde donde fue rechazado
            destinationLocationId: movement.originLocationId, // Vuelve al remitente original
            responsibleId: movement.responsibleId, // El responsable original es quien lo espera
            status: MovementStatus.EN_TRANSIT, // Arranca su viaje de vuelta inmediatamente
            activoIds: movement.activoIds,
            simCardIds: movement.simCardIds,
            notes: `Retorno automático por rechazo del traslado #${movement.id!.slice(-6).toUpperCase()}. Motivo: ${rejectionReason}`,
            shippedAt: new Date()
        });

        // 4. Actualizar los activos involucrados a estado RECHAZADO (novedad)
        // No cambiamos su locationId aún, ya que físicamente empiezan a viajar en el returnMovement
        const assets = await this.activoRepository.findAll();
        const assetsInMovement = assets.filter(a => movement.activoIds.includes(a.id!));

        for (const activo of assetsInMovement) {
            activo.setStatus(EstadoActivo.RECHAZADO);
            await this.activoRepository.update(activo);
        }

        // 5. Persistir y retornar el nuevo movimiento
        return await this.movementRepository.create(returnMovement);
    }
}
