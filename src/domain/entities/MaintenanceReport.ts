import { randomUUID } from 'node:crypto';

export enum ModalidadMantenimiento {
    INTERNO = 'INTERNO',
    EXTERNO = 'EXTERNO',
    INTERNO_ESCALADO = 'INTERNO_ESCALADO'
}

export enum TipoMantenimiento {
    PREVENTIVO = 'PREVENTIVO',
    CORRECTIVO = 'CORRECTIVO'
}

export enum EstadoFicha {
    PENDIENTE_DIAGNOSTICO = 'PENDIENTE_DIAGNOSTICO',
    EN_PROCESO = 'EN_PROCESO',
    REQUIERE_AUTORIZACION = 'REQUIERE_AUTORIZACION',
    ENVIADO_PROVEEDOR = 'ENVIADO_PROVEEDOR',
    CERRADO = 'CERRADO'
}

export enum ResultadoFinal {
    REPARADO = 'REPARADO',
    IRREPARABLE = 'IRREPARABLE',
    SIN_FALLAS = 'SIN_FALLAS'
}

export interface MaintenanceReportProps {
    id?: string;
    activoId: string;
    modalidad: ModalidadMantenimiento;
    tipoMantenimiento: TipoMantenimiento;
    estado: EstadoFicha;
    diagnostico?: string;
    accionesRealizadas?: string;
    repuestosUsados?: string;
    costoEstimado?: number;
    costoFinal?: number;
    cubiertoPorGarantia?: boolean;
    tecnicoResponsable?: string;
    // Escalación interna → externa
    escalaAProveedor?: boolean;
    motivoEscalacion?: string;
    fechaEscalacion?: Date;
    // Datos proveedor externo
    proveedorServicio?: string;
    referenciaOrdenServicio?: string;
    soporteProveedorUrl?: string;
    // Autorización
    soporteAutorizacionUrl?: string;
    // Resultado
    resultadoFinal?: ResultadoFinal;
    // Tiempos
    fechaApertura?: Date;
    fechaInicioInterno?: Date;
    fechaDiagnostico?: Date;
    fechaEnvioProveedor?: Date;
    fechaRetornoProveedor?: Date;
    fechaCierre?: Date;
    // Relación con movimiento de retorno que originó la ficha
    movimientoOrigenId?: string;
}

export class MaintenanceReport {
    private props: MaintenanceReportProps;

    constructor(props: MaintenanceReportProps) {
        this.props = {
            ...props,
            id: props.id || randomUUID(),
            estado: props.estado || EstadoFicha.PENDIENTE_DIAGNOSTICO,
            fechaApertura: props.fechaApertura || new Date(),
            cubiertoPorGarantia: props.cubiertoPorGarantia ?? false,
            escalaAProveedor: props.escalaAProveedor ?? false,
        };
        this.validar();
    }

    private validar() {
        if (!this.props.activoId) throw new Error('El activo es obligatorio para una ficha de mantenimiento');
        if (!this.props.modalidad) throw new Error('La modalidad de mantenimiento es obligatoria');
        if (!this.props.tipoMantenimiento) throw new Error('El tipo de mantenimiento es obligatorio');
    }

    // Getters
    get id() { return this.props.id; }
    get activoId() { return this.props.activoId; }
    get modalidad() { return this.props.modalidad; }
    get tipoMantenimiento() { return this.props.tipoMantenimiento; }
    get estado() { return this.props.estado; }
    get diagnostico() { return this.props.diagnostico; }
    get accionesRealizadas() { return this.props.accionesRealizadas; }
    get repuestosUsados() { return this.props.repuestosUsados; }
    get costoEstimado() { return this.props.costoEstimado; }
    get costoFinal() { return this.props.costoFinal; }
    get cubiertoPorGarantia() { return this.props.cubiertoPorGarantia; }
    get tecnicoResponsable() { return this.props.tecnicoResponsable; }
    get escalaAProveedor() { return this.props.escalaAProveedor; }
    get motivoEscalacion() { return this.props.motivoEscalacion; }
    get fechaEscalacion() { return this.props.fechaEscalacion; }
    get proveedorServicio() { return this.props.proveedorServicio; }
    get referenciaOrdenServicio() { return this.props.referenciaOrdenServicio; }
    get soporteProveedorUrl() { return this.props.soporteProveedorUrl; }
    get soporteAutorizacionUrl() { return this.props.soporteAutorizacionUrl; }
    get resultadoFinal() { return this.props.resultadoFinal; }
    get fechaApertura() { return this.props.fechaApertura; }
    get fechaInicioInterno() { return this.props.fechaInicioInterno; }
    get fechaDiagnostico() { return this.props.fechaDiagnostico; }
    get fechaEnvioProveedor() { return this.props.fechaEnvioProveedor; }
    get fechaRetornoProveedor() { return this.props.fechaRetornoProveedor; }
    get fechaCierre() { return this.props.fechaCierre; }
    get movimientoOrigenId() { return this.props.movimientoOrigenId; }

    // --- Lógica de Negocio ---

    public iniciarProceso(diagnostico: string, tecnico?: string) {
        if (this.props.estado !== EstadoFicha.PENDIENTE_DIAGNOSTICO) {
            throw new Error('La ficha debe estar en estado "Pendiente Diagnóstico" para iniciar el proceso');
        }
        this.props.diagnostico = diagnostico;
        this.props.tecnicoResponsable = tecnico;
        this.props.estado = EstadoFicha.EN_PROCESO;
        this.props.fechaDiagnostico = new Date();
        if (this.props.modalidad === ModalidadMantenimiento.INTERNO) {
            this.props.fechaInicioInterno = new Date();
        }
    }

    public escalarAProveedor(motivo: string, proveedor?: string) {
        if (this.props.modalidad !== ModalidadMantenimiento.INTERNO) {
            throw new Error('Solo se puede escalar a proveedor un mantenimiento iniciado como interno');
        }
        if (!motivo) throw new Error('El motivo de escalación es obligatorio');
        this.props.modalidad = ModalidadMantenimiento.INTERNO_ESCALADO;
        this.props.escalaAProveedor = true;
        this.props.motivoEscalacion = motivo;
        this.props.fechaEscalacion = new Date();
        this.props.proveedorServicio = proveedor;
        this.props.estado = EstadoFicha.ENVIADO_PROVEEDOR;
        this.props.fechaEnvioProveedor = new Date();
    }

    public registrarRetornoDeProveedor(referenciaOrden?: string, soporteUrl?: string) {
        if (this.props.estado !== EstadoFicha.ENVIADO_PROVEEDOR) {
            throw new Error('La ficha debe estar en estado "Enviado a Proveedor" para registrar el retorno');
        }
        this.props.referenciaOrdenServicio = referenciaOrden;
        this.props.soporteProveedorUrl = soporteUrl;
        this.props.fechaRetornoProveedor = new Date();
        this.props.estado = EstadoFicha.EN_PROCESO;
    }

    public solicitarAutorizacion(soporteUrl?: string) {
        if (this.props.estado !== EstadoFicha.EN_PROCESO) {
            throw new Error('La ficha debe estar en proceso para solicitar autorización');
        }
        this.props.soporteAutorizacionUrl = soporteUrl;
        this.props.estado = EstadoFicha.REQUIERE_AUTORIZACION;
    }

    public aprobar() {
        if (this.props.estado !== EstadoFicha.REQUIERE_AUTORIZACION) {
            throw new Error('La ficha debe estar en estado "Requiere Autorización" para ser aprobada');
        }
        this.props.estado = EstadoFicha.EN_PROCESO;
    }

    public cerrar(resultado: ResultadoFinal, accionesRealizadas: string, costoFinal?: number, repuestos?: string) {
        if (this.props.estado !== EstadoFicha.EN_PROCESO && this.props.estado !== EstadoFicha.PENDIENTE_DIAGNOSTICO) {
            throw new Error('La ficha debe estar en proceso o pendiente de diagnóstico para ser cerrada');
        }
        if (!accionesRealizadas) throw new Error('Las acciones realizadas son obligatorias para cerrar la ficha');
        
        if (this.props.estado === EstadoFicha.PENDIENTE_DIAGNOSTICO) {
            this.props.fechaDiagnostico = new Date();
            this.props.diagnostico = this.props.diagnostico || accionesRealizadas;
        }
        
        this.props.resultadoFinal = resultado;
        this.props.accionesRealizadas = accionesRealizadas;
        this.props.costoFinal = (costoFinal !== undefined && costoFinal !== null) ? costoFinal : 0;
        this.props.repuestosUsados = repuestos;
        this.props.fechaCierre = new Date();
        this.props.estado = EstadoFicha.CERRADO;
    }

    public update(campos: Partial<MaintenanceReportProps>) {
        this.props = { ...this.props, ...campos, id: this.props.id };
    }

    public toJSON() {
        return { ...this.props };
    }
}
