import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('activos') // Nombre de la tabla en SQL
export class ActivoEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ unique: true })
    placa!: string;

    @Column()
    tipo!: string;

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
}
