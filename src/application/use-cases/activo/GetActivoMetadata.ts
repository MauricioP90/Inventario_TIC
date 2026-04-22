import { ITipoActivoRepository } from "../../../domain/repositories/ITipoActivoRepository";
import { EstadoActivo } from "../../../domain/entities/Activo";
import { EstadoTipoActivo } from "../../../domain/entities/TipoActivo";

export class GetActivoMetadata {
    constructor(private readonly tipoActivoRepo: ITipoActivoRepository) { }

    async execute() {
        const tiposDB = await this.tipoActivoRepo.findAll();

        // Filtramos para que al Frontend solo le lleguen los tipos "ACTIVOS"
        const tiposActivos = tiposDB.filter(t => t.estado === EstadoTipoActivo.ACTIVO);

        return {
            statuses: [
                { id: EstadoActivo.BODEGA, label: 'En Bodega', color: 'bg-emerald-500' },
                { id: EstadoActivo.OPERACION, label: 'En Operación', color: 'bg-blue-600' },
                { id: EstadoActivo.MANTENIMIENTO, label: 'Mantenimiento', color: 'bg-amber-500' },
                { id: EstadoActivo.BAJA, label: 'Baja / Inactivo', color: 'bg-red-600' }
            ],
            // Transformamos los datos de la BD a un formato sencillo para el combobox del Frontend
            types: tiposActivos.map(t => ({
                id: t.id,
                label: t.nombre
            }))
        };
    }
}
