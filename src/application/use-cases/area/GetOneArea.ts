import { Area } from "../../../domain/entities/Area";
import { IAreaRepository } from "../../../domain/repositories/IAreaRepository";

export class GetOneArea {
    constructor(private readonly areaRepository: IAreaRepository) { }

    async execute(id: string): Promise<Area | null> {
        return await this.areaRepository.findById(id);
    }
}
