import { Entity, PrimaryColumn, Column, ManyToMany, JoinTable, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { LocationEntity } from './LocationEntity';
import { ActivoEntity } from './ActivoEntity';
import { AreaEntity } from './AreaEntity';
import { CargoEntity } from './CargoEntity';

@Entity('responsables')
export class ResponsibleEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column()
    nombre!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    telefono!: string;

    @Column()
    estado!: string;

@ManyToMany(() => LocationEntity, (location) => location.responsibles)
    @JoinTable({
        name: 'responsible_locations',
        joinColumn: { name: 'responsible_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'location_id', referencedColumnName: 'id' }
    })
    locations!: LocationEntity[];

    @ManyToOne(() => AreaEntity, (area) => area.responsibles)
    @JoinColumn({ name: 'area_id' })
    area?: AreaEntity;

    @ManyToOne(() => CargoEntity, (cargo) => cargo.responsibles)
    @JoinColumn({ name: 'cargo_id' })
    cargo?: CargoEntity;

    @Column({ name: 'tipo_documento', default: 'CC', nullable: true })
    tipoDocumento?: string;

    @Column({ name: 'numero_documento', nullable: true })
    numeroDocumento?: string;

    @Column({ name: 'fecha_expedicion_documento', type: 'date', nullable: true })
    fechaExpedicionDocumento?: string | null;

    @Column({ nullable: true })
    direccion?: string;


    @OneToMany(() => ActivoEntity, (activo) => activo.responsible)
    activos!: ActivoEntity[];

    // Virtual fields for loadRelationCountAndMap
    activosCount?: number;
    simCardsCount?: number;
}
