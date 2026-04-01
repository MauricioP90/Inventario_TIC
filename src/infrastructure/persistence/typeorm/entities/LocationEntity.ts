import { Entity, PrimaryColumn, Column, ManyToMany } from 'typeorm';
import { ResponsibleEntity } from './ResponsibleEntity';

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

    @Column()
    estado!: string;

    @ManyToMany(() => ResponsibleEntity, (responsible) => responsible.locations)
    responsibles!: ResponsibleEntity[];
}
