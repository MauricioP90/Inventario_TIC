import { Area } from "../../../domain/entities/Area";
import { IAreaRepository } from "../../../domain/repositories/IAreaRepository";

export class GetAllAreas {
    constructor(private readonly areaRepository: IAreaRepository) { }

    async execute(): Promise<Area[]> {
        return await this.areaRepository.findAll();
    }
}
