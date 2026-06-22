import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { LocationEntity } from './LocationEntity';
import { ResponsibleEntity } from './ResponsibleEntity';
import { SIMCardEntity } from './SIMCardEntity';
import { TipoActivoEntity } from './TipoActivoEntity';
import { AreaEntity } from './AreaEntity';

@Entity('activos') // Nombre de la tabla en SQL
export class ActivoEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ unique: true })
    placa!: string;

    @Column()
    marca!: string;

    @Column()
    modelo!: string;

    @Column({ unique: true })
    serial!: string;

    @Column()
    estado!: string;

    @Column({ name: 'factura_url', nullable: true })
    facturaUrl?: string;

    @CreateDateColumn({ name: 'fecha_ingreso' })
    fechaIngreso!: Date;

    @Column({ name: 'location_id', nullable: true })
    locationId?: string;

    @ManyToOne(() => LocationEntity)
    @JoinColumn({ name: 'location_id' })
    location?: LocationEntity;

    @Column({ name: 'responsible_id', nullable: true })
    responsibleId?: string;

    @ManyToOne(() => ResponsibleEntity)
    @JoinColumn({ name: 'responsible_id' })
    responsible?: ResponsibleEntity;

    @Column({ name: 'area_id', default: '8b8b9c8c-1e2a-43cf-8a27-024848bb0000' })
    areaId!: string;

    @ManyToOne(() => AreaEntity)
    @JoinColumn({ name: 'area_id' })
    area?: AreaEntity;

    @OneToMany(() => SIMCardEntity, simCard => simCard.activo)
    simCards?: SIMCardEntity[];

    @Column({ name: 'tipo_activo_id', nullable: true })
    tipoActivoId?: string;

    @ManyToOne(() => TipoActivoEntity, (tipoActivo) => tipoActivo.activos)
    @JoinColumn({ name: 'tipo_activo_id' })
    tipoActivo?: TipoActivoEntity;

    @Column({ name: 'precio_compra', type: 'decimal', precision: 12, scale: 2, nullable: true })
    precioCompra?: number;
}
