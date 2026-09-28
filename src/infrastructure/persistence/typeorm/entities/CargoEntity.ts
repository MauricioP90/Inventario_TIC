import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ResponsibleEntity } from "./ResponsibleEntity";

@Entity('cargos')
export class CargoEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ unique: true })
    nombre!: string;

    @Column({ default: 'ACTIVO' })
    estado!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @OneToMany(() => ResponsibleEntity, (responsible) => responsible.cargo)
    responsibles!: ResponsibleEntity[];
}
