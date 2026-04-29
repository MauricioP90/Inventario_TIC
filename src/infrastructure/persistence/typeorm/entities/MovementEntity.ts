import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { LocationEntity } from './LocationEntity';
import { ResponsibleEntity } from './ResponsibleEntity';
import { ActivoEntity } from './ActivoEntity';
import { MovementStatus } from '../../../../domain/entities/Movement';

@Entity('movements')
export class MovementEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ name: 'responsible_id' })
    responsibleId!: string;

    @Column({ name: 'receiver_id', nullable: true })
    receiverId?: string;

    @Column()
    type!: string; // Ejemplo: 'TRASLADO', 'ASIGNACION', 'MANTENIMIENTO'

    @Column({ name: 'origin_location_id' })
    originLocationId!: string;

    @Column({ name: 'destination_location_id' })
    destinationLocationId!: string;

    @Column({
        type: 'varchar',
        default: MovementStatus.PENDING
    })
    status!: MovementStatus;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ name: 'evidence_url', nullable: true })
    evidenceUrl?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @Column({ name: 'shipped_at', nullable: true })
    shippedAt?: Date;

    @Column({ name: 'received_at', nullable: true })
    receivedAt?: Date;

    @Column({ name: 'received_evidence_url', nullable: true })
    receivedEvidenceUrl?: string;

    @ManyToOne(() => ResponsibleEntity)
    @JoinColumn({ name: 'receiver_id' })
    receiver!: ResponsibleEntity;

    @ManyToOne(() => LocationEntity)
    @JoinColumn({ name: 'origin_location_id' })
    originLocation!: LocationEntity;

    @ManyToOne(() => LocationEntity)
    @JoinColumn({ name: 'destination_location_id' })
    destinationLocation!: LocationEntity;

    @ManyToOne(() => ResponsibleEntity)
    @JoinColumn({ name: 'responsible_id' })
    responsible!: ResponsibleEntity;

    @ManyToMany(() => ActivoEntity)
    @JoinTable({
        name: 'movement_activos',
        joinColumn: { name: 'movement_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'activo_id', referencedColumnName: 'id' }
    })
    activos!: ActivoEntity[];
}
