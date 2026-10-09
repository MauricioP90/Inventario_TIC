import { Movement, MovementStatus } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { EstadoActivo } from "../../../domain/entities/Activo";

export class CancelMovement {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository
    ) { }

    async execute(id: string, reason: string, cancelledBy?: string): Promise<Movement> {
        // 1. Buscar el movimiento
        const movement = await this.movementRepository.findById(id);
        if (!movement) {
            throw new Error('Movimiento no encontrado');
        }

        // 2. Validar que esté en PENDIENTE
        if (movement.status !== MovementStatus.PENDING) {
            throw new Error(`Solo se pueden anular movimientos en estado PENDIENTE. El estado actual es "${movement.status}".`);
        }

        if (!reason || reason.trim() === '') {
            throw new Error('El motivo de anulación es obligatorio.');
        }

        // 3. Aplicar lógica de dominio
        movement.cancel();

        // 4. Registrar auditoría en notas
        const currentNotes = movement.notes ? `${movement.notes}\n` : '';
        const authorInfo = cancelledBy ? ` por ${cancelledBy}` : '';
        const timestamp = new Date().toLocaleString('es-CO');
        (movement as any).props.notes = `${currentNotes}[ANULADO${authorInfo} - ${timestamp}] Motivo: ${reason.trim()}`;

        // 5. Si fue un movimiento que afectó el estado del activo en la creación (ej. BAJA_ACTIVO o HURTO_PERDIDA), restaurar a DISPONIBLE
        if (movement.type === 'BAJA_ACTIVO' || movement.type === 'HURTO_PERDIDA') {
            for (const activoId of movement.activoIds) {
                const activo = await this.activoRepository.findById(activoId);
                if (activo && activo.estado === EstadoActivo.BAJA) {
                    activo.setStatus(EstadoActivo.DISPONIBLE);
                    await this.activoRepository.update(activo);
                }
            }
        }

        // 6. Persistir cambios
        return await this.movementRepository.update(movement);
    }
}
