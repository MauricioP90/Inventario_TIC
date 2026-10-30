import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('activo_telemetry_logs')
export class ActivoTelemetryLogEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ name: 'activo_id', type: 'uuid' })
    activoId!: string;

    @Index()
    @Column({ type: 'varchar', length: 60 })
    placa!: string;

    @Column({ name: 'reported_coords', type: 'varchar', length: 80 })
    reportedCoords!: string;

    @Column({ name: 'reported_ip', type: 'varchar', length: 60, nullable: true })
    reportedIp!: string | null;

    @Column({ name: 'expected_location_id', type: 'uuid', nullable: true })
    expectedLocationId!: string | null;

    @Column({ name: 'expected_location_name', type: 'varchar', length: 150, nullable: true })
    expectedLocationName!: string | null;

    @Column({ name: 'detected_location_id', type: 'uuid', nullable: true })
    detectedLocationId!: string | null;

    @Column({ name: 'detected_location_name', type: 'varchar', length: 180, nullable: true })
    detectedLocationName!: string | null;

    @Column({ name: 'distance_km', type: 'numeric', precision: 10, scale: 2, nullable: true })
    distanceKm!: number | null;

    @Index()
    @Column({ type: 'varchar', length: 40, default: 'CONFORME' })
    status!: string;

    @Column({ name: 'alert_sent', type: 'boolean', default: false })
    alertSent!: boolean;

    @Column({ name: 'notification_uuid', type: 'varchar', length: 100, nullable: true })
    notificationUuid!: string | null;

    @Column({ type: 'text', nullable: true })
    observaciones!: string | null;

    @CreateDateColumn({ name: 'reported_at' })
    reportedAt!: Date;
}

