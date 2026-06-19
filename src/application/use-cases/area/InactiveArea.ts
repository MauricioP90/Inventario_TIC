import { Area } from "../../../domain/entities/Area";
import { IAreaRepository } from "../../../domain/repositories/IAreaRepository";

export class InactiveArea {
    constructor(private readonly areaRepository: IAreaRepository) { }

    async execute(id: string, action: 'ACTIVATE' | 'INACTIVATE'): Promise<Area> {
        if (action === 'ACTIVATE') {
            return await this.areaRepository.activate(id);
        } else {
            return await this.areaRepository.inactivate(id);
        }
    }
}
