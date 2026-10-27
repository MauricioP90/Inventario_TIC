import { Movement } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { EstadoActivo, Activo } from "../../../domain/entities/Activo";
import { IUnitOfWork } from "../../../domain/repositories/IUnitOfWork";
import { IEventBus, MovementDispatchedDomainEvent } from "../../../domain/events";

export class DispatchMovement {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository,
        private readonly eventBus?: IEventBus,
        private readonly unitOfWork?: IUnitOfWork
    ) { }

    async execute(id: string, evidenceUrl?: string, documentUrl?: string, recipients?: string[], notifyWhatsApp: boolean = true): Promise<Movement> {
        // 1. Buscar el movimiento
        const movement = await this.movementRepository.findById(id);
        if (!movement) {
            throw new Error('Movimiento no encontrado');
        }

        // 2. Aplicar lógica de dominio (cambiar a EN_TRANSIT y asociar guía de envío y/o acta/comodato firmado)
        movement.dispatch(evidenceUrl, documentUrl);

        // 3. Buscar los activos uno por uno para capturar detalles
        const isLocalOperation = movement.type.startsWith('SIM_');
        const assetsDetails: { placa: string; marca: string; modelo: string; serial: string }[] = [];
        const loadedAssets: Activo[] = [];
        for (const activoId of movement.activoIds) {
            const activo = await this.activoRepository.findById(activoId);
            if (activo) {
                loadedAssets.push(activo);
                assetsDetails.push({
                    placa: activo.placa,
                    marca: activo.marca,
                    modelo: activo.modelo,
                    serial: activo.serial
                });
            }
        }

        // 4. Persistir cambios del movimiento y de los activos en transacción atómica (ACID)
        const executeMutations = async (repos: {
            movementRepository: IMovementRepository;
            activoRepository: IActivoRepository;
        }): Promise<Movement> => {
            if (!isLocalOperation) {
                for (const activo of loadedAssets) {
                    activo.setStatus(EstadoActivo.EN_TRANSIT);
                    await repos.activoRepository.update(activo);
                }
            }
            return await repos.movementRepository.update(movement);
        };

        const savedMovement = this.unitOfWork
            ? await this.unitOfWork.runInTransaction(async (repos) => executeMutations(repos))
            : await executeMutations({
                movementRepository: this.movementRepository,
                activoRepository: this.activoRepository
            });

        // 5. Emitir evento de dominio hacia el bus para notificación asíncrona desacoplada
        if (this.eventBus) {
            await this.eventBus.publish(
                new MovementDispatchedDomainEvent(
                    savedMovement,
                    assetsDetails,
                    recipients,
                    notifyWhatsApp
                )
            );
        }

        return savedMovement;
    }
}
