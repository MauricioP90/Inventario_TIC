import { Movement, MovementStatus } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { EstadoActivo } from "../../../domain/entities/Activo";
import { IUnitOfWork } from "../../../domain/repositories/IUnitOfWork";

export class RejectMovement {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository,
        private readonly unitOfWork?: IUnitOfWork
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

        if (!rejectionReason || !rejectionReason.trim()) {
            throw new Error('El motivo del rechazo es obligatorio');
        }

        // 2. Aplicar lógica de dominio para rechazar (encapsulado)
        movement.recordRejection(rejectionReason);

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
            notes: `Retorno automático por rechazo del traslado #${movement.id!.slice(-6).toUpperCase()}. Motivo: ${rejectionReason.trim()}`,
            shippedAt: new Date()
        });

        // 4. Persistir mutaciones en transacción atómica (ACID)
        const executeMutations = async (repos: {
            movementRepository: IMovementRepository;
            activoRepository: IActivoRepository;
        }): Promise<Movement> => {
            // Guardar el movimiento cancelado
            await repos.movementRepository.update(movement);

            // Actualizar los activos involucrados a estado RECHAZADO mediante búsqueda directa por IDs
            const assetsInMovement = await repos.activoRepository.findByIds(movement.activoIds);
            for (const activo of assetsInMovement) {
                activo.setStatus(EstadoActivo.RECHAZADO);
                await repos.activoRepository.update(activo);
            }

            // Persistir y retornar el nuevo movimiento de retorno
            return await repos.movementRepository.create(returnMovement);
        };

        return this.unitOfWork
            ? await this.unitOfWork.runInTransaction(async (repos) => executeMutations(repos))
            : await executeMutations({
                movementRepository: this.movementRepository,
                activoRepository: this.activoRepository
            });
    }
}
