import { Movement, MovementStatus } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { EstadoActivo } from "../../../domain/entities/Activo";
import { IUnitOfWork } from "../../../domain/repositories/IUnitOfWork";

export class RejectByMagicLink {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository,
        private readonly unitOfWork?: IUnitOfWork
    ) { }

    async execute(token: string, rejectionReason: string): Promise<Movement> {
        // 1. Buscar el movimiento por token mágico
        const movement = await this.movementRepository.findByMagicLinkToken(token);

        if (!movement) {
            throw new Error('Enlace de autenticación única inválido o expirado.');
        }

        if (movement.status !== 'EN_TRANSIT') {
            throw new Error('Este movimiento no está en tránsito y no puede ser rechazado.');
        }

        if (!rejectionReason || rejectionReason.trim() === '') {
            throw new Error('El motivo del rechazo es obligatorio.');
        }

        // 2. Aplicar lógica de dominio para rechazar (encapsulado)
        movement.recordRejection(rejectionReason, true);

        // Para TRASLADO_AREA no hay retorno físico: el equipo no se movió,
        // solo se cancela el acta y no se crea movimiento de retorno.
        if (movement.type === 'TRASLADO_AREA') {
            const executeAreaRejection = async (repos: { movementRepository: IMovementRepository }) => {
                return await repos.movementRepository.update(movement);
            };
            return this.unitOfWork
                ? await this.unitOfWork.runInTransaction(async (repos) => executeAreaRejection(repos))
                : await executeAreaRejection({ movementRepository: this.movementRepository });
        }

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
            notes: `Retorno automático por rechazo (Magic Link) del traslado #${movement.id!.slice(-6).toUpperCase()}. Motivo: ${rejectionReason.trim()}`,
            shippedAt: new Date()
        });

        // 4. Persistir mutaciones en transacción atómica (ACID)
        const executeMutations = async (repos: {
            movementRepository: IMovementRepository;
            activoRepository: IActivoRepository;
        }): Promise<Movement> => {
            await repos.movementRepository.update(movement);

            // Búsqueda directa por IDs para rendimiento O(1)
            const assetsInMovement = await repos.activoRepository.findByIds(movement.activoIds);
            for (const activo of assetsInMovement) {
                activo.setStatus(EstadoActivo.RECHAZADO);
                await repos.activoRepository.update(activo);
            }

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
