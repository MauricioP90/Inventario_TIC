import { Entity, PrimaryColumn, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { LocationEntity } from './LocationEntity';
import { ActivoEntity } from './ActivoEntity';

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

    @Column({ default: 'EXTERNO' })
    rol!: string;

    @ManyToMany(() => LocationEntity, (location) => location.responsibles)
    @JoinTable({
        name: 'responsible_locations',
        joinColumn: { name: 'responsible_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'location_id', referencedColumnName: 'id' }
    })
    locations!: LocationEntity[];

    @OneToMany(() => ActivoEntity, (activo) => activo.responsible)
    activos!: ActivoEntity[];

    // Virtual fields for loadRelationCountAndMap
    activosCount?: number;
    simCardsCount?: number;
}
