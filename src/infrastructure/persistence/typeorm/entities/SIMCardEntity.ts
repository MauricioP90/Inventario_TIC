import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { ActivoEntity } from "./ActivoEntity";
import { LocationEntity } from "./LocationEntity";

@Entity('sim_cards')
export class SIMCardEntity {
    @PrimaryColumn('uuid')
    id: string;

    @Column()
    iccid: string;

    @Column()
    numero: string;

    @Column()
    operador: string;

    @Column()
    estado: string;

    @ManyToOne(() => ActivoEntity, { nullable: true })
    @JoinColumn({ name: 'activo_id' })
    activo?: ActivoEntity;

    @ManyToOne(() => LocationEntity, { nullable: true })
    @JoinColumn({ name: 'location_id' })
    location?: LocationEntity;
}