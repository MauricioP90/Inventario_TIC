import { Movement, MovementStatus } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { EstadoActivo } from "../../../domain/entities/Activo";
import { IUnitOfWork } from "../../../domain/repositories/IUnitOfWork";

export class CancelMovement {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository,
        private readonly unitOfWork?: IUnitOfWork
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

        // 5. Persistir mutaciones en transacción atómica (ACID)
        const executeMutations = async (repos: {
            movementRepository: IMovementRepository;
            activoRepository: IActivoRepository;
        }): Promise<Movement> => {
            // Si fue un movimiento que afectó el estado del activo en la creación (ej. BAJA_ACTIVO o HURTO_PERDIDA), restaurar a DISPONIBLE
            if (movement.type === 'BAJA_ACTIVO' || movement.type === 'HURTO_PERDIDA') {
                for (const activoId of movement.activoIds) {
                    const activo = await repos.activoRepository.findById(activoId);
                    if (activo && activo.estado === EstadoActivo.BAJA) {
                        activo.setStatus(EstadoActivo.DISPONIBLE);
                        await repos.activoRepository.update(activo);
                    }
                }
            }

            return await repos.movementRepository.update(movement);
        };

        return this.unitOfWork
            ? await this.unitOfWork.runInTransaction(async (repos) => executeMutations(repos))
            : await executeMutations({
                movementRepository: this.movementRepository,
                activoRepository: this.activoRepository
            });
    }
}
