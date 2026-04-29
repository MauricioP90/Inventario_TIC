import { ITipoActivoRepository } from "../../../domain/repositories/ITipoActivoRepository";
import { ILocationRepository } from "../../../domain/repositories/ILocationRepository";
import { EstadoActivo } from "../../../domain/entities/Activo";
import { EstadoTipoActivo } from "../../../domain/entities/TipoActivo";
import { TipoLocation } from "../../../domain/entities/Location";

export class GetActivoMetadata {
    constructor(
        private readonly tipoActivoRepo: ITipoActivoRepository,
        private readonly locationRepo: ILocationRepository
    ) { }

    async execute() {
        const tiposDB = await this.tipoActivoRepo.findAll();
        const tiposActivos = tiposDB.filter(t => t.estado === EstadoTipoActivo.ACTIVO);

        // Solo las ubicaciones de tipo BODEGA se muestran en el formulario de creación
        const todasLasLocations = await this.locationRepo.findAll();
        const bodegas = todasLasLocations.filter(l => l.tipo === TipoLocation.BODEGA);

        return {
            statuses: [
                { id: EstadoActivo.BODEGA, label: 'En Bodega' },
                { id: EstadoActivo.OPERACION, label: 'En Operación' },
                { id: EstadoActivo.MANTENIMIENTO, label: 'Mantenimiento' },
                { id: EstadoActivo.BAJA, label: 'Baja / Inactivo' }
            ],
            types: tiposActivos.map(t => ({
                id: t.id,
                label: t.nombre
            })),
            bodegas: bodegas.map(l => ({
                id: l.id,
                nombre: l.nombre
            }))
        };
    }
}
