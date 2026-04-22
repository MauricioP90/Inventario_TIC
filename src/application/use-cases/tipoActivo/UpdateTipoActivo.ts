import { ITipoActivoRepository } from "../../../domain/repositories/ITipoActivoRepository";
import { TipoActivoProps } from "../../../domain/entities/TipoActivo";

export class UpdateTipoActivo {
    constructor(private readonly tipoActivoRepository: ITipoActivoRepository) { }

    async execute(id: string, props: Partial<TipoActivoProps>) {
        const tipoActivo = await this.tipoActivoRepository.findById(id);
        if (!tipoActivo) {
            throw new Error('Tipo de activo no encontrado');
        }
        tipoActivo.update(props);
        return await this.tipoActivoRepository.update(tipoActivo);
    }
}