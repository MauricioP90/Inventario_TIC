import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { LocationEntity } from './LocationEntity';
import { ResponsibleEntity } from './ResponsibleEntity';
import { SIMCardEntity } from './SIMCardEntity';
import { TipoActivoEntity } from './TipoActivoEntity';

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

    @OneToMany(() => SIMCardEntity, simCard => simCard.activo)
    simCards?: SIMCardEntity[];

    @Column({ name: 'tipo_activo_id', nullable: true })
    tipoActivoId?: string;

    @ManyToOne(() => TipoActivoEntity, (tipoActivo) => tipoActivo.activos)
    @JoinColumn({ name: 'tipo_activo_id' })
    tipoActivo?: TipoActivoEntity;
}
