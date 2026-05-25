import { IActivoRepository } from '../../../domain/repositories/IActivoRepository';

export interface DashboardSummary {
  statusCounts: Record<string, number>;
  locationCounts: Record<string, number>;
  responsibleCounts: Record<string, number>;
  typeCounts: Record<string, number>;
}

export class GetDashboardSummary {
  constructor(private readonly activoRepo: IActivoRepository) {}

  async execute(): Promise<DashboardSummary> {
    const activos = await this.activoRepo.findAll();

    const statusCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};
    const responsibleCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    for (const activo of activos) {
      // Conteo por estado
      const estado = activo.estado;
      statusCounts[estado] = (statusCounts[estado] ?? 0) + 1;

      // Conteo por ubicación
      const sede = activo.location?.nombre ?? 'Sin sede';
      locationCounts[sede] = (locationCounts[sede] ?? 0) + 1;

      // Conteo por responsable
      const resp = activo.responsable?.nombre ?? 'Sin responsable';
      responsibleCounts[resp] = (responsibleCounts[resp] ?? 0) + 1;

      // Conteo por tipo de dispositivo
      const tipo = activo.tipoActivo?.nombre ?? 'Sin tipo';
      typeCounts[tipo] = (typeCounts[tipo] ?? 0) + 1;
    }

    return { statusCounts, locationCounts, responsibleCounts, typeCounts };
  }
}
