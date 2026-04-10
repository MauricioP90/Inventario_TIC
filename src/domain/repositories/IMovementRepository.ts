import { Movement } from "../entities/Movement";

export interface IMovementRepository {
    create(movement: Movement): Promise<Movement>;
    update(movement: Movement): Promise<Movement>;
    findById(id: string): Promise<Movement | null>;
    findAllByActivoId(activoId: string): Promise<Movement[]>;
    findAllByLocationId(locationId: string): Promise<Movement[]>;
    findAll(): Promise<Movement[]>;
}
