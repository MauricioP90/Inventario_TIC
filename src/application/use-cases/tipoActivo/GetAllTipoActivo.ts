import { ITipoActivoRepository } from "../../../domain/repositories/ITipoActivoRepository";

export class GetAllTipoActivo {
    constructor(private readonly tipoActivoRepository: ITipoActivoRepository) { }

    async execute() {
        return await this.tipoActivoRepository.findAll();
    }
}