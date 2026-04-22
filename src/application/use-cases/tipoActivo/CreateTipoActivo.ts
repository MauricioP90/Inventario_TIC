import { ITipoActivoRepository } from "../../../domain/repositories/ITipoActivoRepository";
import { TipoActivo } from "../../../domain/entities/TipoActivo";
import { TipoActivoProps } from "../../../domain/entities/TipoActivo";

export class CreateTipoActivo {
    constructor(private readonly tipoActivoRepository: ITipoActivoRepository) { }

    async execute(props: TipoActivoProps) {
        const tipoActivo = new TipoActivo(props);
        return await this.tipoActivoRepository.save(tipoActivo);
    }
}
