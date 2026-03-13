import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('locations')
export class LocationEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column()
    nombre!: string;

    @Column()
    responsableId!: string;

    @Column()
    direccion!: string;

    @Column()
    estado!: string;
}
