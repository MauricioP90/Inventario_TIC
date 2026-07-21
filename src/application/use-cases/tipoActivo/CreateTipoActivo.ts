import { ITipoActivoRepository } from "../../../domain/repositories/ITipoActivoRepository";
import { TipoActivo, EstadoTipoActivo } from "../../../domain/entities/TipoActivo";
import { TipoActivoProps } from "../../../domain/entities/TipoActivo";

function toTitleCase(str: string): string {
    return str
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export class CreateTipoActivo {
    constructor(private readonly tipoActivoRepository: ITipoActivoRepository) { }

    async execute(props: TipoActivoProps) {
        const nombreNormalizado = toTitleCase(props.nombre);

        // Verificar duplicado (insensible a mayúsculas)
        const existente = await this.tipoActivoRepository.findByNombreInsensitive(nombreNormalizado);
        if (existente) {
            throw new Error(`Ya existe el tipo "${existente.nombre}". Usa el existente o elige otro nombre.`);
        }

        const tipoActivo = new TipoActivo({
            ...props,
            nombre: nombreNormalizado,
            estado: props.estado || EstadoTipoActivo.ACTIVO,
        });
        await this.tipoActivoRepository.save(tipoActivo);
        return tipoActivo;
    }
}
