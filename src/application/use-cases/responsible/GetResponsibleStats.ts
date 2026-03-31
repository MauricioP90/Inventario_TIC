import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";


export interface ResponsibleStats {
    totalActivos: number;
    totalSIMCards: number;
}


export class GetResponsibleStats {

    constructor(private readonly activoRepo: IActivoRepository, private readonly simCardRepo: ISIMCardRepository) { }

    async execute(responsibleId: string): Promise<ResponsibleStats> {

        const [totalActivos, totalSIMCards] = await Promise.all([
            this.activoRepo.countByResponsibleId(responsibleId),
            this.simCardRepo.countByResponsibleId(responsibleId)
        ]);

        return {
            totalActivos,
            totalSIMCards
        };
    }
}