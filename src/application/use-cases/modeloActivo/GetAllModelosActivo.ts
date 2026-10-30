import { IModeloActivoRepository } from "../../../domain/repositories/IModeloActivoRepository";
import { ModeloActivo } from "../../../domain/entities/ModeloActivo";

export class GetAllModelosActivo {
    constructor(private readonly modeloActivoRepository: IModeloActivoRepository) {}

    async execute(tipoActivoId?: string): Promise<ModeloActivo[]> {
        if (tipoActivoId) {
            return await this.modeloActivoRepository.findByTipoActivoId(tipoActivoId);
        }
        return await this.modeloActivoRepository.findAll();
    }
}
