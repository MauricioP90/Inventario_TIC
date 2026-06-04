import { SIMCard, EstadoSIM } from "../../../domain/entities/SIMCard";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";

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
    constructor(private readonly simCardRepository: ISIMCardRepository) { }

    async execute(input: UpdateSIMCardInput): Promise<SIMCard> {
        const simCard = await this.simCardRepository.findById(input.id);
        if (!simCard) throw new Error('SIMCard no encontrada');

        const targetActivoId = input.activoId === null || input.activoId === '' ? undefined : (input.activoId || simCard.activoId);
        if (targetActivoId && input.locationId && input.locationId !== '') {
            throw new Error('La SIM Card está vinculada a un dispositivo y no se puede cambiar su ubicación de forma independiente.');
        }

        simCard.update({
            iccid: input.iccid,
            numero: input.numero,
            operador: input.operador,
            estado: input.estado as EstadoSIM,
            activoId: input.activoId === null || input.activoId === '' ? undefined : input.activoId,
            locationId: input.locationId === null || input.locationId === '' ? undefined : input.locationId
        });

        await this.simCardRepository.save(simCard);
        return simCard;
    }
}