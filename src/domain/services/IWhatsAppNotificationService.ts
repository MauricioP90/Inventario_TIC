export interface IWhatsAppNotificationService {
    sendMovementDispatchNotification(params: {
        toPhone: string;
        receiverName: string;
        consecutivo: string;
        magicLinkUrl: string;
        equiposSummary: string;
        originLocation?: string;
        destinationLocation?: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }>;

    sendUnauthorizedLocationAlert(params: {
        toPhone: string;
        recipientName: string;
        placa: string;
        equipoDesc: string;
        expectedLocationName: string;
        detectedLocationName: string;
        distanceKm: number;
        reportedCoords: string;
        detectedAt?: string;
    }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}
