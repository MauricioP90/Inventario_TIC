import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import { ResponsibleEntity } from "./ResponsibleEntity"

@Entity('roles')
export class RoleEntity {
    @PrimaryColumn('uuid')
    id: string;

    @Column()
    nombre: string;

    @Column()
    estado: string;

    @OneToMany(() => ResponsibleEntity, (responsible) => responsible.role)
    responsibles!: ResponsibleEntity[];

}