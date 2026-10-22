import { Movement } from "../../../domain/entities/Movement";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { IEmailService } from "../../../domain/services/IEmailService";
import { IWhatsAppNotificationService } from "../../../domain/services/IWhatsAppNotificationService";
import { EstadoActivo } from "../../../domain/entities/Activo";

export class DispatchMovement {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository,
        private readonly locationRepository?: ILocationRepository,
        private readonly responsibleRepository?: IResponsibleRepository,
        private readonly emailService?: IEmailService,
        private readonly whatsAppService?: IWhatsAppNotificationService
    ) { }

    async execute(id: string, evidenceUrl?: string, documentUrl?: string, recipients?: string[], notifyWhatsApp: boolean = true): Promise<Movement> {
        // 1. Buscar el movimiento
        const movement = await this.movementRepository.findById(id);
        if (!movement) {
            throw new Error('Movimiento no encontrado');
        }

        // 2. Aplicar lógica de dominio (cambiar a EN_TRANSIT y asociar guía de envío y/o acta/comodato firmado)
        movement.dispatch(evidenceUrl, documentUrl);

        // 3. Buscar los activos uno por uno, guardar detalles y actualizarlos a EN_TRANSITO (para traslados físicos)
        const isLocalOperation = movement.type.startsWith('SIM_');
        const assetsDetails: { placa: string; marca: string; modelo: string; serial: string }[] = [];
        for (const activoId of movement.activoIds) {
            const activo = await this.activoRepository.findById(activoId);
            if (activo) {
                assetsDetails.push({
                    placa: activo.placa,
                    marca: activo.marca,
                    modelo: activo.modelo,
                    serial: activo.serial
                });
                if (!isLocalOperation) {
                    activo.setStatus(EstadoActivo.EN_TRANSIT);
                    await this.activoRepository.update(activo);
                }
            }
        }

        // 4. Persistir cambios del movimiento
        const savedMovement = await this.movementRepository.update(movement);

        // 5. Enviar notificación por correo con el soporte de despacho / acta firmada
        if (this.emailService && this.locationRepository && this.responsibleRepository) {
            try {
                const originLoc = await this.locationRepository.findById(movement.originLocationId);
                const destLoc = await this.locationRepository.findById(movement.destinationLocationId);
                const resp = await this.responsibleRepository.findById(movement.responsibleId);

                const recipientsList = (recipients && recipients.length > 0)
                    ? recipients
                    : (resp && resp.email ? [resp.email] : []);
                const notifUuid = await this.emailService.sendMovementNotification(
                    savedMovement,
                    recipientsList,
                    {
                        activos: assetsDetails,
                        originLocation: originLoc?.nombre ?? 'Sin sede origen',
                        destinationLocation: destLoc?.nombre ?? 'Sin sede destino',
                        responsibleName: resp?.nombre ?? 'Sin responsable'
                    }
                );

                if (notifUuid) {
                    savedMovement.setNotificationUuid(notifUuid);
                    await this.movementRepository.update(savedMovement);
                }
            } catch (mailError) {
                console.error("Error al enviar notificación de soporte por correo al despachar:", mailError);
            }
        }

        // 6. Enviar notificación por WhatsApp (Wasapi) si el despachador lo habilitó y el responsable tiene celular
        if (notifyWhatsApp && this.whatsAppService && this.responsibleRepository && savedMovement.magicLinkToken) {
            try {
                const resp = await this.responsibleRepository.findById(movement.responsibleId);
                const phone = resp?.telefono;
                if (phone && phone.trim()) {
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
                    const magicLinkUrl = `${frontendUrl}/public/receive/${savedMovement.magicLinkToken}`;
                    const originLoc = this.locationRepository ? await this.locationRepository.findById(movement.originLocationId) : null;
                    const destLoc = this.locationRepository ? await this.locationRepository.findById(movement.destinationLocationId) : null;

                    // Formatear código de consecutivo amigable (ej: #E46AC397)
                    const consecutivoCode = savedMovement.id
                        ? `#${savedMovement.id.substring(0, 8).toUpperCase()}`
                        : '';

                    // Formatear resumen descriptivo de equipos enviados
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

                    let equiposSummary = `${savedMovement.activoIds.length} equipo(s)`;
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
                console.error("Error al enviar notificación de WhatsApp al despachar:", waError.message);
            }
        }

        return savedMovement;
    }
}

