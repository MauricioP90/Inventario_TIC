import { Area } from "../../../domain/entities/Area";
import { IAreaRepository } from "../../../domain/repositories/IAreaRepository";

export class CreateArea {
    constructor(private readonly areaRepository: IAreaRepository) { }

    async execute(area: Area): Promise<Area> {
        return await this.areaRepository.create(area);
    }
}
