import { ITipoActivoRepository } from "../../../domain/repositories/ITipoActivoRepository";

export class GetOneTipoActivo {
    constructor(private readonly tipoActivoRepository: ITipoActivoRepository) { }

    async execute(id: string) {
        const tipoActivo = await this.tipoActivoRepository.findById(id);
        if (!tipoActivo) {
            throw new Error('Tipo de activo no encontrado');
        }
        return tipoActivo;
    }
}