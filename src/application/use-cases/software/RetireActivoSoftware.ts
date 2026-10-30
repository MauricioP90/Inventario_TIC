import { IActivoSoftwareRepository } from "../../../domain/repositories/IActivoSoftwareRepository";
import { ActivoSoftwareHistory } from "../../../domain/entities/ActivoSoftwareHistory";

export interface RetireActivoSoftwareDto {
    historyId: string;
    retiradoPor: string;
    motivoRetiro?: string;
}

export class RetireActivoSoftware {
    constructor(private readonly activoSoftwareRepo: IActivoSoftwareRepository) {}

    async execute(dto: RetireActivoSoftwareDto): Promise<ActivoSoftwareHistory> {
        const item = await this.activoSoftwareRepo.findById(dto.historyId);
        if (!item) {
            throw new Error("El registro de software no fue encontrado.");
        }

        if (item.estado !== 'INSTALADO') {
            throw new Error(`Este software no se encuentra en estado INSTALADO (Estado actual: ${item.estado}).`);
        }

        item.retirar(dto.retiradoPor, new Date(), dto.motivoRetiro);
        return this.activoSoftwareRepo.update(item);
    }
}
