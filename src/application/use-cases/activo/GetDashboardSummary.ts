import { IActivoRepository } from '../../../domain/repositories/IActivoRepository';
import { EstadoActivo } from '../../../domain/entities/Activo';

export interface StateDistribution {
  total: number;
  disponible: number;
  asignado: number;
  mantenimiento: number;
  baja: number;
  enTransito: number;
  rechazado: number;
}

export interface DashboardSummary {
  totalCount: number;
  disponibleCount: number;
  asignadoCount: number;
  mantenimientoCount: number;
  bajaCount: number;
  enTransitoCount: number;
  rechazadoCount: number;
  typeStacked: Record<string, { disponible: number; asignado: number }>;
  typeBaja: Record<string, number>;
  typeMantenimiento: Record<string, number>;
  /** Desglose por modelo dentro de cada tipo — disponibles vs asignados (drill-down principal) */
  modelStacked: Record<string, Record<string, { disponible: number; asignado: number }>>;
  /** Desglose por modelo dentro de cada tipo — en mantenimiento */
  modelMantenimiento: Record<string, Record<string, number>>;
  /** Desglose por modelo dentro de cada tipo — dados de baja */
  modelBaja: Record<string, Record<string, number>>;
  /** Desglose completo de estados por tipo de activo */
  stateDistributionByType: Record<string, StateDistribution>;
  /** Desglose completo de estados por modelo agrupado por tipo: tipo -> modelo -> estados */
  stateDistributionByModel: Record<string, Record<string, StateDistribution>>;
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
    let enTransitoCount = 0;
    let rechazadoCount = 0;

    const typeStacked: Record<string, { disponible: number; asignado: number }> = {};
    const typeBaja: Record<string, number> = {};
    const typeMantenimiento: Record<string, number> = {};
    const modelStacked: Record<string, Record<string, { disponible: number; asignado: number }>> = {};
    const modelMantenimiento: Record<string, Record<string, number>> = {};
    const modelBaja: Record<string, Record<string, number>> = {};

    const stateDistributionByType: Record<string, StateDistribution> = {};
    const stateDistributionByModel: Record<string, Record<string, StateDistribution>> = {};

    for (const activo of activos) {
      const typeLabel = activo.tipoActivo?.nombre || 'Sin tipo';
      const modelLabel = activo.modelo || 'Sin modelo';

      // Inicializar estructura de distribución por Tipo
      if (!stateDistributionByType[typeLabel]) {
        stateDistributionByType[typeLabel] = {
          total: 0,
          disponible: 0,
          asignado: 0,
          mantenimiento: 0,
          baja: 0,
          enTransito: 0,
          rechazado: 0,
        };
      }
      stateDistributionByType[typeLabel].total++;

      // Inicializar estructura de distribución por Modelo (dentro del Tipo)
      if (!stateDistributionByModel[typeLabel]) {
        stateDistributionByModel[typeLabel] = {};
      }
      if (!stateDistributionByModel[typeLabel][modelLabel]) {
        stateDistributionByModel[typeLabel][modelLabel] = {
          total: 0,
          disponible: 0,
          asignado: 0,
          mantenimiento: 0,
          baja: 0,
          enTransito: 0,
          rechazado: 0,
        };
      }
      stateDistributionByModel[typeLabel][modelLabel].total++;

      if (activo.estado === EstadoActivo.DISPONIBLE) {
        disponibleCount++;
        stateDistributionByType[typeLabel].disponible++;
        stateDistributionByModel[typeLabel][modelLabel].disponible++;

        if (!typeStacked[typeLabel]) typeStacked[typeLabel] = { disponible: 0, asignado: 0 };
        typeStacked[typeLabel].disponible++;
        // Drill-down por modelo
        if (!modelStacked[typeLabel]) modelStacked[typeLabel] = {};
        if (!modelStacked[typeLabel][modelLabel]) modelStacked[typeLabel][modelLabel] = { disponible: 0, asignado: 0 };
        modelStacked[typeLabel][modelLabel].disponible++;
      } else if (activo.estado === EstadoActivo.OPERACION) {
        asignadoCount++;
        stateDistributionByType[typeLabel].asignado++;
        stateDistributionByModel[typeLabel][modelLabel].asignado++;

        if (!typeStacked[typeLabel]) typeStacked[typeLabel] = { disponible: 0, asignado: 0 };
        typeStacked[typeLabel].asignado++;
        // Drill-down por modelo
        if (!modelStacked[typeLabel]) modelStacked[typeLabel] = {};
        if (!modelStacked[typeLabel][modelLabel]) modelStacked[typeLabel][modelLabel] = { disponible: 0, asignado: 0 };
        modelStacked[typeLabel][modelLabel].asignado++;
      } else if (activo.estado === EstadoActivo.MANTENIMIENTO) {
        mantenimientoCount++;
        stateDistributionByType[typeLabel].mantenimiento++;
        stateDistributionByModel[typeLabel][modelLabel].mantenimiento++;

        typeMantenimiento[typeLabel] = (typeMantenimiento[typeLabel] ?? 0) + 1;
        // Drill-down por modelo (mantenimiento)
        if (!modelMantenimiento[typeLabel]) modelMantenimiento[typeLabel] = {};
        modelMantenimiento[typeLabel][modelLabel] = (modelMantenimiento[typeLabel][modelLabel] ?? 0) + 1;
      } else if (activo.estado === EstadoActivo.BAJA) {
        bajaCount++;
        stateDistributionByType[typeLabel].baja++;
        stateDistributionByModel[typeLabel][modelLabel].baja++;

        typeBaja[typeLabel] = (typeBaja[typeLabel] ?? 0) + 1;
        // Drill-down por modelo (baja)
        if (!modelBaja[typeLabel]) modelBaja[typeLabel] = {};
        modelBaja[typeLabel][modelLabel] = (modelBaja[typeLabel][modelLabel] ?? 0) + 1;
      } else if (activo.estado === EstadoActivo.EN_TRANSIT) {
        enTransitoCount++;
        stateDistributionByType[typeLabel].enTransito++;
        stateDistributionByModel[typeLabel][modelLabel].enTransito++;
      } else if (activo.estado === EstadoActivo.RECHAZADO) {
        rechazadoCount++;
        stateDistributionByType[typeLabel].rechazado++;
        stateDistributionByModel[typeLabel][modelLabel].rechazado++;
      }
    }

    return {
      totalCount,
      disponibleCount,
      asignadoCount,
      mantenimientoCount,
      bajaCount,
      enTransitoCount,
      rechazadoCount,
      typeStacked,
      typeBaja,
      typeMantenimiento,
      modelStacked,
      modelMantenimiento,
      modelBaja,
      stateDistributionByType,
      stateDistributionByModel
    };
  }
}
