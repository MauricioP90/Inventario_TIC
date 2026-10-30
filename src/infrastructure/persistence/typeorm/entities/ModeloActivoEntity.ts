import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { TipoActivoEntity } from "./TipoActivoEntity";

@Entity('modelos_activos')
export class ModeloActivoEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ name: 'tipo_activo_id' })
    tipoActivoId!: string;

    @ManyToOne(() => TipoActivoEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tipo_activo_id' })
    tipoActivo?: TipoActivoEntity;

    @Column()
    marca!: string;

    @Column()
    modelo!: string;

    @Column({ default: 'ACTIVO' })
    estado!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
