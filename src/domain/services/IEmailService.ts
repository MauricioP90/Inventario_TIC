import { Movement } from "../entities/Movement";

export interface IEmailService {
    sendMovementNotification(
        movement: Movement,
        recipients: string[],
        details: {
            activos: any[];
            originLocation: string;
            destinationLocation: string;
            responsibleName: string;
        }
    ): Promise<string | null>;

    sendMovementReceiptNotification(
        movement: Movement,
        details: {
            activos: any[];
            originLocation: string;
            destinationLocation: string;
            responsibleName: string;
            receiverName: string;
            receivedEvidenceUrl?: string;
        }
    ): Promise<string | null>;

    sendUnauthorizedLocationAlert?(details: {
        placa: string;
        serial: string;
        marca: string;
        modelo: string;
        tipoNombre: string;
        responsibleName: string;
        responsibleEmail?: string;
        expectedLocationName: string;
        expectedLocationCoords?: string | null;
        detectedLocationName: string;
        reportedCoords: string;
        reportedIp?: string | null;
        distanceKm: number;
    }): Promise<string | null>;
}
