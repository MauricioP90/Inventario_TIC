import { MovementReceivedDomainEvent } from "../../domain/events/MovementReceivedDomainEvent";
import { IEmailService } from "../../domain/services/IEmailService";
import { ILocationRepository } from "../../domain/repositories/ILocationRepository";
import { IResponsibleRepository } from "../../domain/repositories/IResponsibleRepository";

export class SendMovementReceivedNotificationHandler {
    constructor(
        private readonly emailService?: IEmailService,
        private readonly locationRepository?: ILocationRepository,
        private readonly responsibleRepository?: IResponsibleRepository
    ) { }

    async handle(event: MovementReceivedDomainEvent): Promise<void> {
        const { movement, receiverId, receiverEvidenceUrl, assetsDetails } = event;

        if (this.emailService && this.locationRepository && this.responsibleRepository) {
            try {
                const originLoc = await this.locationRepository.findById(movement.originLocationId);
                const destLoc = await this.locationRepository.findById(movement.destinationLocationId);
                const originResp = await this.responsibleRepository.findById(movement.responsibleId);
                const receiverResp = await this.responsibleRepository.findById(receiverId);

                await this.emailService.sendMovementReceiptNotification(
                    movement,
                    {
                        activos: assetsDetails,
                        originLocation: originLoc?.nombre ?? 'Sin sede origen',
                        destinationLocation: destLoc?.nombre ?? 'Sin sede destino',
                        responsibleName: originResp?.nombre ?? 'Sin custodio',
                        receiverName: receiverResp?.nombre ?? movement.physicalReceiverName ?? 'Receptor Destino',
                        receivedEvidenceUrl: receiverEvidenceUrl
                    }
                );
            } catch (mailError: any) {
                console.error("[SendMovementReceivedNotificationHandler] Error al enviar correo de recepción:", mailError?.message || mailError);
            }
        }
    }
}
