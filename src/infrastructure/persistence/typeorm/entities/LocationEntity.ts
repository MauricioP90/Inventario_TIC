import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('locations')
export class LocationEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ unique: true })
    code!: string;

    @Column()
    nombre!: string;

    @Column()
    responsableId!: string;

    @Column({ nullable: true })
    coordenadas?: string;

    @Column()
    estado!: string;
}
