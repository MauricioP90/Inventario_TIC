import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import { ActivoEntity } from "./ActivoEntity"

@Entity('tipo_activos')
export class TipoActivoEntity {
    @PrimaryColumn('uuid')
    id: string;

    @Column()
    nombre: string;

    @Column()
    estado: string;

    @OneToMany(() => ActivoEntity, (activo) => activo.tipoActivo)
    activos!: ActivoEntity[];

}