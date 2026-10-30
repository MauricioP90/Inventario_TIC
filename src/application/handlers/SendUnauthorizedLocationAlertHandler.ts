import { UnauthorizedLocationDetectedDomainEvent } from '../../domain/events/UnauthorizedLocationDetectedDomainEvent';
import { IEmailService } from '../../domain/services/IEmailService';
import { IWhatsAppNotificationService } from '../../domain/services/IWhatsAppNotificationService';
import { IActivoTelemetryRepository } from '../../domain/repositories/IActivoTelemetryRepository';
import { IResponsibleRepository } from '../../domain/repositories/IResponsibleRepository';
import { EstadoResponsable } from '../../domain/entities/Responsible';

export class SendUnauthorizedLocationAlertHandler {
    constructor(
        private readonly emailService?: IEmailService,
        private readonly telemetryRepository?: IActivoTelemetryRepository,
        private readonly whatsAppService?: IWhatsAppNotificationService,
        private readonly responsibleRepository?: IResponsibleRepository
    ) {}

    async handle(event: UnauthorizedLocationDetectedDomainEvent): Promise<void> {
        // 1. Notificación por Correo Electrónico
        if (this.emailService?.sendUnauthorizedLocationAlert) {
            try {
                const notifUuid = await this.emailService.sendUnauthorizedLocationAlert(event.activoDetails);
                if (notifUuid && this.telemetryRepository) {
                    event.telemetryLog.markAlertSent(notifUuid);
                    await this.telemetryRepository.save(event.telemetryLog);
                }
            } catch (error: any) {
                console.error('[SendUnauthorizedLocationAlertHandler] Error al enviar alerta de correo:', error?.message || error);
            }
        }

        // 2. Notificación por WhatsApp (Wasapi / Meta)
        if (this.whatsAppService && this.telemetryRepository) {
            try {
                const settings = await this.telemetryRepository.getSettings();
                if (settings.whatsappEnabled !== false) {
                    const targets = new Map<string, string>(); // phone -> name

                    // 2.1 Notificar al custodio titular si está habilitado
                    if (settings.whatsappNotifyCustodian !== false && event.activoDetails.responsiblePhone) {
                        targets.set(event.activoDetails.responsiblePhone, event.activoDetails.responsibleName);
                    }

                    // 2.2 Notificar a los funcionarios según sus cargos configurados
                    if (settings.whatsappCargoIds && settings.whatsappCargoIds.length > 0 && this.responsibleRepository) {
                        const allResponsibles = await this.responsibleRepository.findAll();
                        for (const resp of allResponsibles) {
                            if (
                                resp.estado === EstadoResponsable.ACTIVO &&
                                resp.telefono &&
                                resp.cargo?.id &&
                                settings.whatsappCargoIds.includes(resp.cargo.id)
                            ) {
                                targets.set(resp.telefono, resp.nombre);
                            }
                        }
                    }

                    // 2.3 Enviar a cada destinatario en paralelo
                    const promises = Array.from(targets.entries()).map(([phone, name]) =>
                        this.whatsAppService!.sendUnauthorizedLocationAlert({
                            toPhone: phone,
                            recipientName: name,
                            placa: event.activoDetails.placa,
                            equipoDesc: `${event.activoDetails.marca} ${event.activoDetails.modelo}`,
                            expectedLocationName: event.activoDetails.expectedLocationName,
                            detectedLocationName: event.activoDetails.detectedLocationName,
                            distanceKm: event.activoDetails.distanceKm,
                            reportedCoords: event.activoDetails.reportedCoords
                        })
                    );

                    await Promise.allSettled(promises);
                }
            } catch (waError: any) {
                console.error('[SendUnauthorizedLocationAlertHandler] Error al procesar alertas WhatsApp:', waError?.message || waError);
            }
        }
    }
}

