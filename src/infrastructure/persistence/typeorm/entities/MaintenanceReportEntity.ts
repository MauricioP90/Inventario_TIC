import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ActivoEntity } from './ActivoEntity';
import { ModalidadMantenimiento, TipoMantenimiento, EstadoFicha, ResultadoFinal } from '../../../../domain/entities/MaintenanceReport';

@Entity('maintenance_reports')
export class MaintenanceReportEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ name: 'activo_id' })
    activoId!: string;

    @Column({ name: 'modalidad', default: ModalidadMantenimiento.INTERNO })
    modalidad!: ModalidadMantenimiento;

    @Column({ name: 'tipo_mantenimiento', default: TipoMantenimiento.CORRECTIVO })
    tipoMantenimiento!: TipoMantenimiento;

    @Column({ name: 'estado', default: EstadoFicha.PENDIENTE_DIAGNOSTICO })
    estado!: EstadoFicha;

    @Column({ name: 'diagnostico', type: 'text', nullable: true })
    diagnostico?: string;

    @Column({ name: 'acciones_realizadas', type: 'text', nullable: true })
    accionesRealizadas?: string;

    @Column({ name: 'repuestos_usados', type: 'text', nullable: true })
    repuestosUsados?: string;

    @Column({ name: 'costo_estimado', type: 'decimal', precision: 12, scale: 2, nullable: true })
    costoEstimado?: number;

    @Column({ name: 'costo_final', type: 'decimal', precision: 12, scale: 2, nullable: true })
    costoFinal?: number;

    @Column({ name: 'cubierto_por_garantia', default: false })
    cubiertoPorGarantia!: boolean;

    @Column({ name: 'tecnico_responsable', nullable: true })
    tecnicoResponsable?: string;

    @Column({ name: 'escala_a_proveedor', default: false })
    escalaAProveedor!: boolean;

    @Column({ name: 'motivo_escalacion', type: 'text', nullable: true })
    motivoEscalacion?: string;

    @Column({ name: 'fecha_escalacion', nullable: true })
    fechaEscalacion?: Date;

    @Column({ name: 'proveedor_servicio', nullable: true })
    proveedorServicio?: string;

    @Column({ name: 'referencia_orden_servicio', nullable: true })
    referenciaOrdenServicio?: string;

    @Column({ name: 'soporte_proveedor_url', nullable: true })
    soporteProveedorUrl?: string;

    @Column({ name: 'soporte_autorizacion_url', nullable: true })
    soporteAutorizacionUrl?: string;

    @Column({ name: 'resultado_final', nullable: true })
    resultadoFinal?: ResultadoFinal;

    @Column({ name: 'movimiento_origen_id', nullable: true })
    movimientoOrigenId?: string;

    @CreateDateColumn({ name: 'fecha_apertura' })
    fechaApertura!: Date;

    @Column({ name: 'fecha_inicio_interno', nullable: true })
    fechaInicioInterno?: Date;

    @Column({ name: 'fecha_diagnostico', nullable: true })
    fechaDiagnostico?: Date;

    @Column({ name: 'fecha_envio_proveedor', nullable: true })
    fechaEnvioProveedor?: Date;

    @Column({ name: 'fecha_retorno_proveedor', nullable: true })
    fechaRetornoProveedor?: Date;

    @Column({ name: 'fecha_cierre', nullable: true })
    fechaCierre?: Date;

    @ManyToOne(() => ActivoEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'activo_id' })
    activo?: ActivoEntity;
}
