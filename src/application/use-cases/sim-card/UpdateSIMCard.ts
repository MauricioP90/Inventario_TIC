import { SIMCard, EstadoSIM } from "../../../domain/entities/SIMCard";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";
import { IMovementRepository } from "../../../domain/repositories/IMovementRepository";
import { MovementStatus } from "../../../domain/entities/Movement";

interface UpdateSIMCardInput {
    id: string;
    iccid?: string;
    numero?: string;
    operador?: string;
    estado?: string;
    activoId?: string | null;
    locationId?: string | null;
}

export class UpdateSIMCard {
    constructor(
        private readonly simCardRepository: ISIMCardRepository,
        private readonly movementRepository?: IMovementRepository
    ) { }

    async execute(input: UpdateSIMCardInput): Promise<SIMCard> {
        const simCard = await this.simCardRepository.findById(input.id);
        if (!simCard) throw new Error('SIMCard no encontrada');

        // 1. Bloquear mutación de sede o estado mientras tenga un SIM_TRASLADO en curso
        if (this.movementRepository && typeof this.movementRepository.findAll === 'function') {
            const allMovements = await this.movementRepository.findAll();
            const activeSimMov = allMovements.find(m =>
                (m.status === MovementStatus.PENDING || m.status === MovementStatus.EN_TRANSIT) &&
                m.simCardIds.includes(simCard.id!)
            );
            if (activeSimMov) {
                const hasLocationChange = input.locationId !== undefined && (input.locationId || undefined) !== simCard.locationId;
                const hasEstadoChange = input.estado !== undefined && input.estado !== simCard.estado;
                if (hasLocationChange || hasEstadoChange) {
                    const movCode = (activeSimMov.id || '').slice(-6).toUpperCase();
                    throw new Error(`No se puede modificar la ubicación o el estado de la SIM Card porque tiene un traslado en curso (#${movCode}).`);
                }
            }
        }

        const targetActivoId = input.activoId === null || input.activoId === '' ? undefined : (input.activoId || simCard.activoId);
        const currentEstado = simCard.estado;
        const requestedEstado = input.estado as EstadoSIM | undefined;

        // 2. Si está vinculada a un dispositivo, hereda su sede y ciclo de vida (no se edita estado ni ubicación manualmente)
        if (targetActivoId) {
            if (input.locationId && input.locationId !== '' && input.locationId !== simCard.locationId) {
                throw new Error('La SIM Card está vinculada a un dispositivo y no se puede cambiar su ubicación de forma independiente.');
            }
            if (requestedEstado && requestedEstado !== currentEstado) {
                const placaInfo = simCard.activo?.placa ? ` ("${simCard.activo.placa}")` : '';
                throw new Error(`No se puede cambiar manualmente el estado de la SIM Card a "${requestedEstado}" mientras esté vinculada al dispositivo${placaInfo}. Usa el módulo de Movimientos (Retiro o Hurto/Pérdida).`);
            }
        } else {
            // 3. Si NO está vinculada a un dispositivo: bloquear transición manual hacia ASIGNADA o POR_REPOSICION
            if (requestedEstado === EstadoSIM.ASIGNADA) {
                throw new Error('Para asignar una SIM Card a un dispositivo utiliza el módulo de Movimientos (Operaciones de SIM).');
            }
            if (requestedEstado === EstadoSIM.POR_REPOSICION && currentEstado !== EstadoSIM.POR_REPOSICION) {
                throw new Error('El estado POR_REPOSICION solo se genera automáticamente ante un reporte de Hurto / Pérdida del dispositivo.');
            }
        }

        const finalEstado = requestedEstado || currentEstado;
        const resolvedLocationId = targetActivoId
            ? simCard.locationId
            : (input.locationId === null || input.locationId === '' ? undefined : (input.locationId !== undefined ? input.locationId : simCard.locationId));

        if (!targetActivoId && finalEstado === EstadoSIM.BODEGA && !resolvedLocationId) {
            throw new Error('Debe especificar una ubicación de bodega válida para dejar la SIM Card en BODEGA.');
        }

        simCard.update({
            iccid: input.iccid,
            numero: input.numero,
            operador: input.operador,
            estado: finalEstado,
            activoId: targetActivoId,
            locationId: resolvedLocationId
        });

        await this.simCardRepository.save(simCard);
        return simCard;
    }
}