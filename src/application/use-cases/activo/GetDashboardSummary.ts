import { IActivoRepository } from '../../../domain/repositories/IActivoRepository';
import { EstadoActivo } from '../../../domain/entities/Activo';

export interface DashboardSummary {
  totalCount: number;
  disponibleCount: number;
  asignadoCount: number;
  mantenimientoCount: number;
  bajaCount: number;
  typeStacked: Record<string, { disponible: number; asignado: number }>;
  typeBaja: Record<string, number>;
}

export class GetDashboardSummary {
  constructor(private readonly activoRepo: IActivoRepository) {}

  async execute(): Promise<DashboardSummary> {
    const activos = await this.activoRepo.findAll();

    const totalCount = activos.length;
    let disponibleCount = 0;
    let asignadoCount = 0;
    let mantenimientoCount = 0;
    let bajaCount = 0;

    const typeStacked: Record<string, { disponible: number; asignado: number }> = {};
    const typeBaja: Record<string, number> = {};

    for (const activo of activos) {
      const typeLabel = activo.tipoActivo?.nombre || 'Sin tipo';

      if (activo.estado === EstadoActivo.DISPONIBLE) {
        disponibleCount++;
        if (!typeStacked[typeLabel]) typeStacked[typeLabel] = { disponible: 0, asignado: 0 };
        typeStacked[typeLabel].disponible++;
      } else if (activo.estado === EstadoActivo.OPERACION) {
        asignadoCount++;
        if (!typeStacked[typeLabel]) typeStacked[typeLabel] = { disponible: 0, asignado: 0 };
        typeStacked[typeLabel].asignado++;
      } else if (activo.estado === EstadoActivo.MANTENIMIENTO) {
        mantenimientoCount++;
        if (!typeStacked[typeLabel]) typeStacked[typeLabel] = { disponible: 0, asignado: 0 };
        typeStacked[typeLabel].asignado++;
      } else if (activo.estado === EstadoActivo.BAJA) {
        bajaCount++;
        typeBaja[typeLabel] = (typeBaja[typeLabel] ?? 0) + 1;
      }
    }

    return {
      totalCount,
      disponibleCount,
      asignadoCount,
      mantenimientoCount,
      bajaCount,
      typeStacked,
      typeBaja
    };
  }
}
