import { Movement } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";

export class GetMovements {
    constructor(private readonly movementRepository: IMovementRepository) {}

    async execute(filters?: { activoId?: string, locationId?: string }): Promise<Movement[]> {
        if (filters?.activoId) {
            return await this.movementRepository.findAllByActivoId(filters.activoId);
        }
        if (filters?.locationId) {
            return await this.movementRepository.findAllByLocationId(filters.locationId);
        }
        return await this.movementRepository.findAll();
    }
}
