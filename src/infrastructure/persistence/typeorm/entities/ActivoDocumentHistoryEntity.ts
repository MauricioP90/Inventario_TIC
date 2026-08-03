import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ActivoEntity } from './ActivoEntity';

@Entity('activo_document_history')
export class ActivoDocumentHistoryEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'activo_id' })
    activoId!: string;

    @ManyToOne(() => ActivoEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'activo_id' })
    activo?: ActivoEntity;

    @Column({ name: 'previous_factura_url', nullable: true })
    previousFacturaUrl?: string;

    @Column({ name: 'new_factura_url', nullable: true })
    newFacturaUrl?: string;

    @Column({ name: 'previous_precio_compra', type: 'decimal', precision: 12, scale: 2, nullable: true })
    previousPrecioCompra?: number;

    @Column({ name: 'new_precio_compra', type: 'decimal', precision: 12, scale: 2, nullable: true })
    newPrecioCompra?: number;

    @Column({ name: 'changed_by_user', nullable: true })
    changedByUser?: string;

    @Column({ name: 'justification', type: 'text', nullable: true })
    justification?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
