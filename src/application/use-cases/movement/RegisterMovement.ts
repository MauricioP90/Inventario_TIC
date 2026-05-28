import { Movement, MovementStatus } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";

export interface RegisterMovementDto {
    type: string;
    originLocationId: string;
    destinationLocationId: string;
    responsibleId: string;
    activoIds: string[];
    notes?: string;
}

export class RegisterMovement {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository
    ) {}

    async execute(dto: RegisterMovementDto): Promise<Movement> {
        // Validación de regla de negocio: baja_activo requiere que el equipo no tenga SIMs asociadas
        if (dto.type && dto.type.toUpperCase() === 'BAJA_ACTIVO') {
            for (const activoId of dto.activoIds) {
                const activo = await this.activoRepository.findById(activoId);
                if (activo && !activo.puedeDarDeBaja()) {
                    throw new Error(`No se puede dar de baja el activo con placa "${activo.placa}" porque tiene una o más SIM Cards asociadas. Por favor, retire las SIM Cards primero.`);
                }
            }
        }

        // 1. Crear la instancia de dominio (esto ya valida los campos básicos)
        const movement = new Movement({
            ...dto,
            status: MovementStatus.PENDING
        });

        // 2. Persistir
        return await this.movementRepository.create(movement);
    }
}
