import { IMaintenanceReportRepository } from "../../../domain/repositories/IMaintenanceReportRepository";
import { ResultadoFinal } from "../../../domain/entities/MaintenanceReport";
import { IActivoRepository } from "../../../domain/repositories/IActivoRepository";
import { EstadoActivo } from "../../../domain/entities/Activo";

interface UpdateMaintenanceReportInput {
    id: string;
    accion: 'iniciar' | 'escalar' | 'retorno_proveedor' | 'solicitar_autorizacion' | 'aprobar' | 'cerrar' | 'actualizar';
    // Para 'iniciar'
    diagnostico?: string;
    tecnicoResponsable?: string;
    // Para 'escalar'
    motivoEscalacion?: string;
    proveedorServicio?: string;
    // Para 'retorno_proveedor'
    referenciaOrdenServicio?: string;
    soporteProveedorUrl?: string;
    // Para 'solicitar_autorizacion'
    soporteAutorizacionUrl?: string;
    // Para 'cerrar'
    resultadoFinal?: ResultadoFinal;
    accionesRealizadas?: string;
    costoFinal?: number;
    repuestosUsados?: string;
    // Para 'actualizar' (campos libres editables)
    costoEstimado?: number;
    cubiertoPorGarantia?: boolean;
}

export class UpdateMaintenanceReport {
    constructor(
        private readonly maintenanceRepo: IMaintenanceReportRepository,
        private readonly activoRepo: IActivoRepository
    ) { }

    async execute(input: UpdateMaintenanceReportInput): Promise<any> {
        const report = await this.maintenanceRepo.findById(input.id);
        if (!report) throw new Error('Ficha de mantenimiento no encontrada');

        switch (input.accion) {
            case 'iniciar':
                if (!input.diagnostico) throw new Error('El diagnóstico es obligatorio para iniciar el proceso');
                report.iniciarProceso(input.diagnostico, input.tecnicoResponsable);
                break;

            case 'escalar':
                if (!input.motivoEscalacion) throw new Error('El motivo de escalación es obligatorio');
                report.escalarAProveedor(input.motivoEscalacion, input.proveedorServicio);
                break;

            case 'retorno_proveedor':
                report.registrarRetornoDeProveedor(input.referenciaOrdenServicio, input.soporteProveedorUrl);
                break;

            case 'solicitar_autorizacion':
                report.solicitarAutorizacion(input.soporteAutorizacionUrl);
                break;

            case 'aprobar':
                report.aprobar();
                break;

            case 'cerrar':
                if (!input.resultadoFinal) throw new Error('El resultado final es obligatorio para cerrar la ficha');
                if (!input.accionesRealizadas) throw new Error('Las acciones realizadas son obligatorias para cerrar la ficha');
                report.cerrar(input.resultadoFinal, input.accionesRealizadas, input.costoFinal, input.repuestosUsados);

                // Actualizar el estado del activo en función del resultado
                const activo = await this.activoRepo.findById(report.activoId);
                if (activo) {
                    if (input.resultadoFinal === ResultadoFinal.REPARADO) {
                        activo.setStatus(EstadoActivo.DISPONIBLE);
                    } else if (input.resultadoFinal === ResultadoFinal.IRREPARABLE) {
                        activo.darDeBaja();
                    }
                    await this.activoRepo.save(activo);
                }
                break;

            case 'actualizar':
                report.update({
                    ...(input.costoEstimado !== undefined && { costoEstimado: input.costoEstimado }),
                    ...(input.cubiertoPorGarantia !== undefined && { cubiertoPorGarantia: input.cubiertoPorGarantia }),
                    ...(input.tecnicoResponsable !== undefined && { tecnicoResponsable: input.tecnicoResponsable }),
                    ...(input.proveedorServicio !== undefined && { proveedorServicio: input.proveedorServicio }),
                });
                break;
        }

        const saved = await this.maintenanceRepo.save(report);
        return saved.toJSON();
    }
}
