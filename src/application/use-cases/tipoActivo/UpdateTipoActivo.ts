import { ITipoActivoRepository } from "../../../domain/repositories/ITipoActivoRepository";
import { TipoActivoProps } from "../../../domain/entities/TipoActivo";

function toTitleCase(str: string): string {
    return str.trim().toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export class UpdateTipoActivo {
    constructor(private readonly tipoActivoRepository: ITipoActivoRepository) { }

    async execute(id: string, props: Partial<TipoActivoProps>) {
        const tipoActivo = await this.tipoActivoRepository.findById(id);
        if (!tipoActivo) {
            throw new Error('Tipo de activo no encontrado');
        }

        // Si se está cambiando el nombre, normalizar y verificar duplicados
        if (props.nombre) {
            const nombreNormalizado = toTitleCase(props.nombre);
            const existente = await this.tipoActivoRepository.findByNombreInsensitive(nombreNormalizado);
            if (existente && existente.id !== id) {
                throw new Error(`Ya existe el tipo "${existente.nombre}". Elige un nombre diferente.`);
            }
            props = { ...props, nombre: nombreNormalizado };
        }

        tipoActivo.update(props);
        return await this.tipoActivoRepository.update(tipoActivo);
    }
}