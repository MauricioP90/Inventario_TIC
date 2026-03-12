import { Entity, PrimaryColumn, Column } from 'typeorm';

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
}
