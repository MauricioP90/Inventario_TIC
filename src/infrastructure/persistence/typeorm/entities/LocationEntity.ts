import { Entity, PrimaryColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { ResponsibleEntity } from './ResponsibleEntity';
import { AreaEntity } from './AreaEntity';

@Entity('locations')
export class LocationEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ unique: true })
    code!: string;

    @Column()
    nombre!: string;

    @Column({ nullable: true })
    coordenadas?: string;

    @Column({ default: 'OFICINA' })
    tipo!: string;

    @Column()
    estado!: string;

    @Column({ nullable: true, type: 'text' })
    observaciones?: string;

    @ManyToMany(() => ResponsibleEntity, (responsible) => responsible.locations)
    responsibles!: ResponsibleEntity[];

    @ManyToMany(() => AreaEntity, (area) => area.locations)
    @JoinTable({
        name: 'location_areas',
        joinColumn: { name: 'location_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'area_id', referencedColumnName: 'id' }
    })
    areas!: AreaEntity[];
}
