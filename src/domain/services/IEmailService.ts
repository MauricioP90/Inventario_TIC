import { Movement } from "../entities/Movement";

export interface IEmailService {
    sendMovementNotification(
        movement: Movement,
        recipients: string[],
        details: {
            activos: any[],
            originLocation: string,
            destinationLocation: string,
            responsibleName: string,
        }
    ): Promise<void>;
}
