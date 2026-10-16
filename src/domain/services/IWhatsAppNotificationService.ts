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
}
