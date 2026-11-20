import { ITipoActivoRepository } from "../../../domain/repositories/ITipoActivoRepository";
import { IActivoSoftwareRepository } from "../../../domain/repositories/IActivoSoftwareRepository";
import { ISIMCardRepository } from "../../../domain/repositories/ISIMCardRepository";
import { TipoActivoProps } from "../../../domain/entities/TipoActivo";

function toTitleCase(str: string): string {
    return str.trim().toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export class UpdateTipoActivo {
    constructor(
        private readonly tipoActivoRepository: ITipoActivoRepository,
        private readonly activoSoftwareRepository?: IActivoSoftwareRepository,
        private readonly simCardRepository?: ISIMCardRepository
    ) { }

    async execute(id: string, props: Partial<TipoActivoProps>) {
        const tipoActivo = await this.tipoActivoRepository.findById(id);
        if (!tipoActivo) {
            throw new Error('Tipo de activo no encontrado');
        }

        // Regla de negocio: No permitir apagar admiteSoftware si existen equipos con aplicativos INSTALADOS
        if (props.admiteSoftware === false && tipoActivo.admiteSoftware && this.activoSoftwareRepository) {
            const installedCount = await this.activoSoftwareRepository.countActiveByTipoActivoId(id);
            if (installedCount > 0) {
                throw new Error(
                    `No es posible desactivar el soporte de software para "${tipoActivo.nombre}" porque existen ${installedCount} registro(s) de aplicativos actualmente INSTALADOS en activos de este tipo. Retíralos primero desde la ficha de cada equipo.`
                );
            }
        }

        // Regla de negocio: No permitir apagar admiteSim si existen SIM Cards asignadas a equipos de este tipo
        if (props.admiteSim === false && tipoActivo.admiteSim && this.simCardRepository) {
            const assignedSimsCount = await this.simCardRepository.countActiveByTipoActivoId(id);
            if (assignedSimsCount > 0) {
                throw new Error(
                    `No es posible desactivar el soporte de SIM Card para "${tipoActivo.nombre}" porque existen ${assignedSimsCount} tarjeta(s) SIM actualmente ASIGNADA(S) en activos de este tipo. Retíralas primero mediante un movimiento de retiro de SIM.`
                );
            }
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