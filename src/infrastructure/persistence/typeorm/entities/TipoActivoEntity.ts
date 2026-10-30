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

    @Column({ name: 'admite_software', type: 'boolean', default: false })
    admiteSoftware!: boolean;

    @Column({ name: 'admite_telemetria', type: 'boolean', default: false })
    admiteTelemetria!: boolean;

    @OneToMany(() => ActivoEntity, (activo) => activo.tipoActivo)
    activos!: ActivoEntity[];

}