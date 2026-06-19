import { Entity, PrimaryColumn, Column, OneToMany, ManyToMany } from "typeorm";
import { ResponsibleEntity } from "./ResponsibleEntity";
import { LocationEntity } from "./LocationEntity";

@Entity('areas')
export class AreaEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ unique: true })
    code!: string;

    @Column()
    nombre!: string;

    @Column()
    estado!: string;

    @OneToMany(() => ResponsibleEntity, (responsible) => responsible.area)
    responsibles!: ResponsibleEntity[];

    @ManyToMany(() => LocationEntity, (location) => location.areas)
    locations!: LocationEntity[];
}
