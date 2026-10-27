import { MovementDispatchedDomainEvent } from "../../domain/events/MovementDispatchedDomainEvent";
import { IEmailService } from "../../domain/services/IEmailService";
import { IWhatsAppNotificationService } from "../../domain/services/IWhatsAppNotificationService";
import { ILocationRepository } from "../../domain/repositories/ILocationRepository";
import { IResponsibleRepository } from "../../domain/repositories/IResponsibleRepository";
import { IMovementRepository } from "../../domain/repositories/IMovementRepository";

export class SendMovementDispatchedNotificationHandler {
    constructor(
        private readonly emailService?: IEmailService,
        private readonly whatsAppService?: IWhatsAppNotificationService,
        private readonly locationRepository?: ILocationRepository,
        private readonly responsibleRepository?: IResponsibleRepository,
        private readonly movementRepository?: IMovementRepository
    ) { }

    async handle(event: MovementDispatchedDomainEvent): Promise<void> {
        const { movement, assetsDetails, recipients, notifyWhatsApp } = event;

        // 1. Notificación por Correo Electrónico
        if (this.emailService && this.locationRepository && this.responsibleRepository) {
            try {
                const originLoc = await this.locationRepository.findById(movement.originLocationId);
                const destLoc = await this.locationRepository.findById(movement.destinationLocationId);
                const resp = await this.responsibleRepository.findById(movement.responsibleId);

                const recipientsList = (recipients && recipients.length > 0)
                    ? recipients
                    : (resp && resp.email ? [resp.email] : []);

                const notifUuid = await this.emailService.sendMovementNotification(
                    movement,
                    recipientsList,
                    {
                        activos: assetsDetails,
                        originLocation: originLoc?.nombre ?? 'Sin sede origen',
                        destinationLocation: destLoc?.nombre ?? 'Sin sede destino',
                        responsibleName: resp?.nombre ?? 'Sin responsable'
                    }
                );

                if (notifUuid && this.movementRepository) {
                    movement.setNotificationUuid(notifUuid);
                    await this.movementRepository.update(movement);
                }
            } catch (mailError: any) {
                console.error("[SendMovementDispatchedNotificationHandler] Error al enviar correo:", mailError?.message || mailError);
            }
        }

        // 2. Notificación por WhatsApp
        if (notifyWhatsApp && this.whatsAppService && this.responsibleRepository && movement.magicLinkToken) {
            try {
                const resp = await this.responsibleRepository.findById(movement.responsibleId);
                const phone = resp?.telefono;
                if (phone && phone.trim()) {
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
                    const magicLinkUrl = `${frontendUrl}/public/receive/${movement.magicLinkToken}`;
                    const originLoc = this.locationRepository ? await this.locationRepository.findById(movement.originLocationId) : null;
                    const destLoc = this.locationRepository ? await this.locationRepository.findById(movement.destinationLocationId) : null;

                    const consecutivoCode = movement.id
                        ? `#${movement.id.substring(0, 8).toUpperCase()}`
                        : '';

                    const formatAssetName = (act: { marca?: string; modelo?: string; placa?: string }) => {
                        const marca = (act.marca || '').trim();
                        const modelo = (act.modelo || '').trim();
                        let fullName = '';
                        if (marca && modelo) {
                            fullName = modelo.toLowerCase().includes(marca.toLowerCase()) ? modelo : `${marca} ${modelo}`;
                        } else {
                            fullName = modelo || marca || 'Equipo';
                        }
                        return act.placa ? `${fullName} (Placa ${act.placa})` : fullName;
                    };

                    let equiposSummary = `${movement.activoIds.length} equipo(s)`;
                    if (assetsDetails.length === 1) {
                        equiposSummary = formatAssetName(assetsDetails[0]);
                    } else if (assetsDetails.length > 1 && assetsDetails.length <= 3) {
                        const items = assetsDetails.map(a => formatAssetName(a)).join(', ');
                        equiposSummary = `${assetsDetails.length} equipos: ${items}`;
                    } else if (assetsDetails.length > 3) {
                        const firstThree = assetsDetails.slice(0, 3).map(a => formatAssetName(a)).join(', ');
                        equiposSummary = `${assetsDetails.length} equipos: ${firstThree} y ${assetsDetails.length - 3} más`;
                    }

                    await this.whatsAppService.sendMovementDispatchNotification({
                        toPhone: phone,
                        receiverName: resp.nombre,
                        consecutivo: consecutivoCode,
                        magicLinkUrl,
                        equiposSummary,
                        originLocation: originLoc?.nombre,
                        destinationLocation: destLoc?.nombre
                    });
                }
            } catch (waError: any) {
                console.error("[SendMovementDispatchedNotificationHandler] Error al enviar WhatsApp:", waError?.message || waError);
            }
        }
    }
}
