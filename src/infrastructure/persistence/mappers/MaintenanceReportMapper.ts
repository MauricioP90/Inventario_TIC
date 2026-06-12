import { MaintenanceReport, ModalidadMantenimiento, TipoMantenimiento, EstadoFicha, ResultadoFinal } from '../../../domain/entities/MaintenanceReport';
import { MaintenanceReportEntity } from '../typeorm/entities/MaintenanceReportEntity';

export class MaintenanceReportMapper {
    public static toDomain(entity: MaintenanceReportEntity): MaintenanceReport {
        return new MaintenanceReport({
            id: entity.id,
            activoId: entity.activoId,
            modalidad: entity.modalidad as ModalidadMantenimiento,
            tipoMantenimiento: entity.tipoMantenimiento as TipoMantenimiento,
            estado: entity.estado as EstadoFicha,
            diagnostico: entity.diagnostico,
            accionesRealizadas: entity.accionesRealizadas,
            repuestosUsados: entity.repuestosUsados,
            costoEstimado: entity.costoEstimado ? Number(entity.costoEstimado) : undefined,
            costoFinal: entity.costoFinal ? Number(entity.costoFinal) : undefined,
            cubiertoPorGarantia: entity.cubiertoPorGarantia,
            tecnicoResponsable: entity.tecnicoResponsable,
            escalaAProveedor: entity.escalaAProveedor,
            motivoEscalacion: entity.motivoEscalacion,
            fechaEscalacion: entity.fechaEscalacion,
            proveedorServicio: entity.proveedorServicio,
            referenciaOrdenServicio: entity.referenciaOrdenServicio,
            soporteProveedorUrl: entity.soporteProveedorUrl,
            soporteAutorizacionUrl: entity.soporteAutorizacionUrl,
            resultadoFinal: entity.resultadoFinal as ResultadoFinal | undefined,
            movimientoOrigenId: entity.movimientoOrigenId,
            fechaApertura: entity.fechaApertura,
            fechaInicioInterno: entity.fechaInicioInterno,
            fechaDiagnostico: entity.fechaDiagnostico,
            fechaEnvioProveedor: entity.fechaEnvioProveedor,
            fechaRetornoProveedor: entity.fechaRetornoProveedor,
            fechaCierre: entity.fechaCierre,
        });
    }

    public static toPersistence(domain: MaintenanceReport): MaintenanceReportEntity {
        const entity = new MaintenanceReportEntity();
        entity.id = domain.id!;
        entity.activoId = domain.activoId;
        entity.modalidad = domain.modalidad;
        entity.tipoMantenimiento = domain.tipoMantenimiento;
        entity.estado = domain.estado;
        entity.diagnostico = domain.diagnostico;
        entity.accionesRealizadas = domain.accionesRealizadas;
        entity.repuestosUsados = domain.repuestosUsados;
        entity.costoEstimado = domain.costoEstimado;
        entity.costoFinal = domain.costoFinal;
        entity.cubiertoPorGarantia = domain.cubiertoPorGarantia ?? false;
        entity.tecnicoResponsable = domain.tecnicoResponsable;
        entity.escalaAProveedor = domain.escalaAProveedor ?? false;
        entity.motivoEscalacion = domain.motivoEscalacion;
        entity.fechaEscalacion = domain.fechaEscalacion;
        entity.proveedorServicio = domain.proveedorServicio;
        entity.referenciaOrdenServicio = domain.referenciaOrdenServicio;
        entity.soporteProveedorUrl = domain.soporteProveedorUrl;
        entity.soporteAutorizacionUrl = domain.soporteAutorizacionUrl;
        entity.resultadoFinal = domain.resultadoFinal;
        entity.movimientoOrigenId = domain.movimientoOrigenId;
        entity.fechaApertura = domain.fechaApertura!;
        entity.fechaInicioInterno = domain.fechaInicioInterno;
        entity.fechaDiagnostico = domain.fechaDiagnostico;
        entity.fechaEnvioProveedor = domain.fechaEnvioProveedor;
        entity.fechaRetornoProveedor = domain.fechaRetornoProveedor;
        entity.fechaCierre = domain.fechaCierre;
        return entity;
    }
}
