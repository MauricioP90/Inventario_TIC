import { Movement, MovementStatus } from "../../../domain/entities/Movement";
import { EstadoActivo } from "../../../domain/entities/Activo";
import { TipoLocation } from "../../../domain/entities/Location";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { IResponsibleRepository } from "../../../domain/repositories/IResponsibleRepository";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";
import { EstadoSIM } from "../../../domain/entities/SIMCard";
import { IEmailService } from "../../../domain/services/IEmailService";

export interface RegisterMovementDto {
    type: string;
    originLocationId: string;
    destinationLocationId: string;
    responsibleId: string;
    activoIds: string[];
    simCardIds?: string[];
    notes?: string;
    documentUrl?: string;
    evidenceUrl?: string;
    recipients?: string[];
    destinationAreaId?: string; // Solo para TRASLADO_AREA
    // Campos para operaciones atómicas de SIM Cards:
    simCardIdToAssign?: string;
    simCardIdToReplace?: string;
    simCardIdToRemove?: string;
    removedSimNewState?: string;
    simStates?: string[];
}

export class RegisterMovement {
    constructor(
        private readonly movementRepository: IMovementRepository,
        private readonly activoRepository: IActivoRepository,
        private readonly locationRepository: ILocationRepository,
        private readonly responsibleRepository: IResponsibleRepository,
        private readonly emailService: IEmailService,
        private readonly simCardRepository: ISIMCardRepository
    ) { }

    async execute(dto: RegisterMovementDto): Promise<Movement> {

        // Obtener ubicaciones de origen y destino
        const originLocation = await this.locationRepository.findById(dto.originLocationId);
        const destinationLocation = await this.locationRepository.findById(dto.destinationLocationId);

        if (!originLocation || !destinationLocation) {
            throw new Error('Ubicación de origen o destino no encontrada.');
        }

        const isOriginBodega = originLocation.tipo === TipoLocation.PUNTO_TI || (originLocation.tipo as any) === 'BODEGA';
        const isDestBodega = destinationLocation.tipo === TipoLocation.PUNTO_TI || (destinationLocation.tipo as any) === 'BODEGA';
        const isOriginProvider = originLocation.tipo === TipoLocation.PROVEEDOR;
        const isDestProvider = destinationLocation.tipo === TipoLocation.PROVEEDOR;

        if (isOriginProvider && isDestProvider) {
            throw new Error('No se permiten traslados directos entre Proveedores.');
        }

        // Validación de seguridad: no se pueden realizar traslados sobre equipos dados de baja, en tránsito o con traslados activos
        for (const activoId of dto.activoIds) {
            const activo = await this.activoRepository.findById(activoId);
            if (activo) {
                if (activo.estado === 'BAJA') {
                    throw new Error(`El equipo con placa "${activo.placa}" se encuentra dado de BAJA (Inactivo). No está permitido realizar movimientos sobre él.`);
                }
                if (activo.estado === 'EN_TRANSITO' || (activo.estado as any) === 'EN_TRANSIT') {
                    throw new Error(`El equipo con placa "${activo.placa}" se encuentra actualmente EN TRÁNSITO. No se puede generar un nuevo movimiento hasta que sea recibido en su destino.`);
                }

                // Validar que el equipo no tenga movimientos activos pendientes o en tránsito
                const existingMovements = await this.movementRepository.findAllByActivoId(activoId);
                const activeMovement = existingMovements.find(m => m.status === 'PENDING' || m.status === 'EN_TRANSIT');
                if (activeMovement) {
                    const statusLabel = activeMovement.status === 'PENDING' ? 'PENDIENTE DE DESPACHO' : 'EN TRÁNSITO';
                    const movCode = (activeMovement.id || '').slice(-6).toUpperCase();
                    throw new Error(`El equipo con placa "${activo.placa}" ya tiene un movimiento en curso (#${movCode} en estado ${statusLabel}). Debe recibirse o anularse antes de iniciar un nuevo movimiento.`);
                }

                // Validación de mantenimiento: equipos en mantenimiento no pueden moverse a menos que sea a Bodega/Punto TI, Proveedor o retiro de SIM
                if (activo.estado === 'MANTENIMIENTO') {
                    // Regla de Negocio: Asignación o Cambio de SIM no están permitidos durante mantenimiento
                    if (dto.type === 'SIM_ASIGNACION' || dto.type === 'SIM_CAMBIO') {
                        throw new Error(`El equipo con placa "${activo.placa}" está en MANTENIMIENTO. Para asignar o cambiar SIM Card, el equipo debe ser liberado de mantenimiento y pasar a estado DISPONIBLE u OPERACIÓN. Durante el mantenimiento solo está permitido el RETIRO de SIM Cards.`);
                    }

                    const isAllowedMaintenanceMovement = 
                        ['RETORNO_SOPORTE', 'REINGRESO_SOPORTE', 'RETORNO_PROVEEDOR', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(dto.type.toUpperCase()) ||
                        (dto.type.toUpperCase() === 'ENVIO_PROVEEDOR' && 
                         (isOriginBodega || isOriginProvider) && 
                         (isDestBodega || isDestProvider)) ||
                        (dto.type.toUpperCase() === 'TRASLADO_REGIONAL' && isDestBodega);

                    if (!isAllowedMaintenanceMovement) {
                        throw new Error(`El equipo con placa "${activo.placa}" está en MANTENIMIENTO. Solo se permiten traslados hacia Puntos TI / Bodegas, envíos a Proveedor o retiros de SIM Card.`);
                    }
                }
            }
        }

        // Validación de regla de negocio: baja_activo requiere que el equipo no tenga SIMs asociadas
        if (dto.type && dto.type.toUpperCase() === 'BAJA_ACTIVO') {
            for (const activoId of dto.activoIds) {
                const activo = await this.activoRepository.findById(activoId);
                if (activo && !activo.puedeDarDeBaja()) {
                    throw new Error(`No se puede dar de baja el activo con placa "${activo.placa}" porque tiene una o más SIM Cards asociadas. Por favor, retire las SIM Cards primero.`);
                }
            }
        }

        // Validación de destino para envío a proveedor (mantenimiento)
        if (dto.type && dto.type.toUpperCase() === 'ENVIO_PROVEEDOR') {
            if (!isOriginBodega || destinationLocation.tipo !== TipoLocation.PROVEEDOR) {
                throw new Error('El envío a proveedor solo se puede realizar desde un Punto TI / Soporte hacia un Proveedor.');
            }
        }

        // Validación de destino para retorno de proveedor
        if (dto.type && dto.type.toUpperCase() === 'RETORNO_PROVEEDOR') {
            if (originLocation.tipo !== TipoLocation.PROVEEDOR || !isDestBodega) {
                throw new Error('El retorno de proveedor solo se puede realizar desde un Proveedor hacia un Punto TI / Soporte.');
            }
        }
        
        const isTheftOrLoss = dto.type === 'HURTO_PERDIDA';
        const isLocalSIM = ['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL', 'INGRESO_MANTENIMIENTO', 'SALIDA_MANTENIMIENTO', 'BAJA_ACTIVO', 'HURTO_PERDIDA'].includes(dto.type);
        const isAreaTransfer = dto.type === 'TRASLADO_AREA';

        // Validación de Hurto/Pérdida: Exigir denuncio policial
        if (isTheftOrLoss) {
            if (!dto.documentUrl && !dto.evidenceUrl) {
                throw new Error('El soporte o documento del denuncio policial es OBLIGATORIO para registrar un hurto o pérdida.');
            }
        }

        // Para traslado entre áreas: validar que la sede origen === destino y que venga el área destino
        if (isAreaTransfer) {
            if (dto.originLocationId !== dto.destinationLocationId) {
                throw new Error('Un traslado entre áreas debe ocurrir dentro de la misma sede.');
            }
            if (!dto.destinationAreaId) {
                throw new Error('El área destino es obligatoria para un traslado entre áreas.');
            }
            // Validar que el área destino pertenece a la sede
            const loc = await this.locationRepository.findById(dto.originLocationId);
            if (loc && loc.areas && loc.areas.length > 0) {
                const validAreaIds = loc.areas.map((a: any) => a.id);
                if (!validAreaIds.includes(dto.destinationAreaId)) {
                    throw new Error('El área destino no pertenece a la sede seleccionada.');
                }
            }
        }

        // Se permiten traslados en la misma sede únicamente para TRASLADO_AREA y eventos locales
        if (!isAreaTransfer && !isLocalSIM && dto.originLocationId === dto.destinationLocationId) {
            throw new Error('La ubicación de origen y destino no pueden ser la misma.');
        }

        const destinationLocationId = isLocalSIM ? dto.originLocationId : dto.destinationLocationId;

        // Generar magic link de inmediato para TRASLADO_AREA (sin paso de despacho)
        const { randomUUID } = isAreaTransfer ? require('node:crypto') : { randomUUID: () => undefined };
        const areaTransferToken = isAreaTransfer ? randomUUID() : undefined;

        // Procesamiento Atómico de Operaciones de SIM Cards
        const isSimOp = ['SIM_ASIGNACION', 'SIM_CAMBIO', 'SIM_RETIRO', 'SIM_RETIRO_TOTAL'].includes(dto.type);
        if (isSimOp) {
            if (!dto.activoIds || dto.activoIds.length === 0) {
                throw new Error('Debe seleccionar un equipo para la operación de SIM Card.');
            }
            const targetActivo = await this.activoRepository.findById(dto.activoIds[0]);
            if (!targetActivo) {
                throw new Error('Equipo no encontrado.');
            }

            if (dto.type === 'SIM_ASIGNACION') {
                const simId = dto.simCardIdToAssign || (dto.simCardIds && dto.simCardIds[0]);
                if (!simId) throw new Error('Debe seleccionar la SIM Card a asignar.');
                if ((targetActivo.simCards?.length || 0) >= 2) {
                    throw new Error(`El equipo con placa "${targetActivo.placa}" ya tiene 2 SIM Cards asignadas.`);
                }
                const sim = await this.simCardRepository.findById(simId);
                if (!sim) throw new Error('SIM Card a asignar no encontrada.');
                if (sim.estado !== EstadoSIM.BODEGA || sim.activoId) {
                    throw new Error('La SIM Card seleccionada no está disponible en Bodega.');
                }
                if (sim.locationId && targetActivo.locationId && sim.locationId !== targetActivo.locationId) {
                    throw new Error('No se puede asignar la SIM Card: La SIM Card y el Dispositivo deben estar registrados en la misma sede física.');
                }
                sim.asignarAActivo(targetActivo.id!);
                await this.simCardRepository.save(sim);
                targetActivo.asignarSIMCard(sim);
                await this.activoRepository.save(targetActivo);
                dto.simCardIds = [sim.id!];
                const noteTag = `[SIM] Asignada SIM #${sim.numero} (${sim.operador})`;
                dto.notes = dto.notes ? `${dto.notes}\n${noteTag}` : noteTag;

            } else if (dto.type === 'SIM_CAMBIO') {
                const oldSimId = dto.simCardIdToReplace;
                const newSimId = dto.simCardIdToAssign;
                if (!oldSimId || !newSimId) {
                    throw new Error('Debe seleccionar la SIM a reemplazar y la nueva SIM a asignar.');
                }
                const oldSim = await this.simCardRepository.findById(oldSimId);
                if (!oldSim || oldSim.activoId !== targetActivo.id) {
                    throw new Error('La SIM a reemplazar no pertenece a este equipo.');
                }
                const newSim = await this.simCardRepository.findById(newSimId);
                if (!newSim) throw new Error('Nueva SIM Card no encontrada.');
                if (newSim.estado !== EstadoSIM.BODEGA || newSim.activoId) {
                    throw new Error('La nueva SIM Card no está disponible en Bodega.');
                }
                if (newSim.locationId && targetActivo.locationId && newSim.locationId !== targetActivo.locationId) {
                    throw new Error('No se puede cambiar la SIM Card: La nueva SIM Card y el Dispositivo deben estar registrados en la misma sede física.');
                }
                // La SIM saliente siempre queda en la sede actual del equipo (Regla de negocio)
                oldSim.update({ estado: EstadoSIM.BODEGA, activoId: undefined, locationId: targetActivo.locationId });
                await this.simCardRepository.save(oldSim);

                newSim.asignarAActivo(targetActivo.id!);
                await this.simCardRepository.save(newSim);

                targetActivo.removerSIMCard(oldSim.id!);
                targetActivo.asignarSIMCard(newSim);
                await this.activoRepository.save(targetActivo);

                dto.simCardIds = [oldSim.id!, newSim.id!];
                const noteTag = `[SIM] Cambio: Sale #${oldSim.numero} a Bodega en sede, Ingresa #${newSim.numero}`;
                dto.notes = dto.notes ? `${dto.notes}\n${noteTag}` : noteTag;

            } else if (dto.type === 'SIM_RETIRO') {
                const simId = dto.simCardIdToRemove || (dto.simCardIds && dto.simCardIds[0]);
                if (!simId) throw new Error('Debe seleccionar la SIM Card a retirar.');
                const simToRemove = await this.simCardRepository.findById(simId);
                if (!simToRemove || simToRemove.activoId !== targetActivo.id) {
                    throw new Error('La SIM Card a retirar no pertenece a este equipo.');
                }
                const targetState = (dto.removedSimNewState || 'BODEGA') as EstadoSIM;
                // La SIM retirada siempre queda en la sede actual del equipo (Regla de negocio)
                simToRemove.update({ estado: targetState, activoId: undefined, locationId: targetActivo.locationId });
                await this.simCardRepository.save(simToRemove);

                targetActivo.removerSIMCard(simToRemove.id!);
                await this.activoRepository.save(targetActivo);

                dto.simCardIds = [simToRemove.id!];
                const noteTag = `[SIM] Retirada SIM #${simToRemove.numero} (Pasa a ${targetState} en sede)`;
                dto.notes = dto.notes ? `${dto.notes}\n${noteTag}` : noteTag;

            } else if (dto.type === 'SIM_RETIRO_TOTAL') {
                const allSims = (await this.simCardRepository.findAll()).filter(s => s.activoId === targetActivo.id);
                if (allSims.length === 0) {
                    throw new Error(`El equipo con placa "${targetActivo.placa}" no tiene SIM Cards asignadas para retirar.`);
                }
                const processedIds: string[] = [];
                const numbers: string[] = [];
                for (let idx = 0; idx < allSims.length; idx++) {
                    const sim = allSims[idx];
                    const targetState = ((dto.simStates && dto.simStates[idx]) || dto.removedSimNewState || 'BODEGA') as EstadoSIM;
                    // Siempre queda en la sede actual del equipo
                    sim.update({ estado: targetState, activoId: undefined, locationId: targetActivo.locationId });
                    await this.simCardRepository.save(sim);
                    processedIds.push(sim.id!);
                    numbers.push(`#${sim.numero}`);
                }
                targetActivo.limpiarSIMCards();
                await this.activoRepository.save(targetActivo);

                dto.simCardIds = processedIds;
                const noteTag = `[SIM] Retiro total de SIM Cards (${numbers.join(', ')}) a Bodega en sede`;
                dto.notes = dto.notes ? `${dto.notes}\n${noteTag}` : noteTag;
            }
        }

        // 1. Crear la instancia de dominio (esto ya valida los campos básicos)
        const movement = new Movement({
            ...dto,
            // documentUrl: comodato / acta / denuncio policial
            documentUrl: dto.documentUrl || dto.evidenceUrl || undefined,
            evidenceUrl: dto.evidenceUrl || undefined,
            destinationLocationId,
            destinationAreaId: dto.destinationAreaId,
            status: isLocalSIM ? MovementStatus.RECEIVED
                   : isAreaTransfer ? MovementStatus.EN_TRANSIT
                   : MovementStatus.PENDING,
            shippedAt: isLocalSIM ? new Date() : isAreaTransfer ? new Date() : undefined,
            receivedAt: isLocalSIM ? new Date() : undefined,
            magicLinkToken: areaTransferToken
        });

        // 2. Persistir en la base de datos
        const savedMovement = await this.movementRepository.create(movement);

        // 2.1 Si es HURTO_PERDIDA o BAJA_ACTIVO, actualizamos inmediatamente el estado del activo a BAJA
        if (isTheftOrLoss || dto.type === 'BAJA_ACTIVO') {
            for (const activoId of dto.activoIds) {
                const act = await this.activoRepository.findById(activoId);
                if (act) {
                    act.setStatus(EstadoActivo.BAJA);
                    await this.activoRepository.update(act);
                }
            }
        }

        // 3. Sistema de Envío de Soporte por Correo para traslados inmediatos (si el estado no es PENDING)
        // Los traslados en PENDING se notifican al momento del Despacho (DispatchMovement) con el acta/soporte firmado adjunto.
        const isSimMovement = dto.type && dto.type.startsWith('SIM_');
        if (!isSimMovement && savedMovement.status !== MovementStatus.PENDING) {
            try {
                // Obtenemos los nombres reales de origen, destino y responsable para el cuerpo del correo
                const originLoc = await this.locationRepository.findById(dto.originLocationId);
                const destLoc = await this.locationRepository.findById(dto.destinationLocationId);
                const resp = await this.responsibleRepository.findById(dto.responsibleId);
                // Mapeamos los activos para obtener marca, modelo y serial
                const assetsDetails = [];
                for (const actId of dto.activoIds) {
                    const act = await this.activoRepository.findById(actId);
                    if (act) {
                        assetsDetails.push({
                            placa: act.placa,
                            marca: act.marca,
                            modelo: act.modelo,
                            serial: act.serial
                        });
                    }
                }

                // Destinatarios: si no se enviaron explícitos, dejamos array vacío (el servicio consultará el catálogo de eventos)
                const recipientsList = dto.recipients && dto.recipients.length > 0
                    ? dto.recipients
                    : (resp && resp.email ? [resp.email] : []);

                // Disparamos la notificación al proveedor de correos de forma asíncrona
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
                // Si el servicio de correo generó un UUID de auditoría, lo asociamos al movimiento
                if (notifUuid) {
                    savedMovement.setNotificationUuid(notifUuid);
                    await this.movementRepository.update(savedMovement);
                }
            } catch (mailError) {
                // Capturamos el error para no interrumpir el flujo principal si falla el servicio de correo
                console.error("Error al enviar notificación de soporte por correo:", mailError);
            }
        }
        return savedMovement;
    }
}