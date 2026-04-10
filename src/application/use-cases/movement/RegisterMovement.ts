import { Movement, MovementStatus } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";

export interface RegisterMovementDto {
    type: string;
    originLocationId: string;
    destinationLocationId: string;
    responsibleId: string;
    activoIds: string[];
    notes?: string;
}

export class RegisterMovement {
    constructor(private readonly movementRepository: IMovementRepository) {}

    async execute(dto: RegisterMovementDto): Promise<Movement> {
        // 1. Crear la instancia de dominio (esto ya valida los campos básicos)
        const movement = new Movement({
            ...dto,
            status: MovementStatus.PENDING
        });

        // 2. Persistir
        return await this.movementRepository.create(movement);
    }
}
