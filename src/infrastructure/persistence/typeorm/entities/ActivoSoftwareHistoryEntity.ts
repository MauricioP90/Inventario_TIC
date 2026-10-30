import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { ActivoEntity } from "./ActivoEntity";
import { SoftwareVersionEntity } from "./SoftwareVersionEntity";

@Entity("activo_software_history")
export class ActivoSoftwareHistoryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "activo_id", type: "uuid" })
    activoId!: string;

    @Column({ name: "software_version_id", type: "uuid" })
    softwareVersionId!: string;

    @Column({ type: "character varying", length: 100, nullable: true })
    licencia?: string;

    @Column({ type: "character varying", length: 20, default: "INSTALADO" })
    estado!: string;

    @Column({ name: "fecha_instalacion", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    fechaInstalacion!: Date;

    @Column({ name: "fecha_retiro", type: "timestamp", nullable: true })
    fechaRetiro?: Date;

    @Column({ name: "instalado_por", type: "character varying", length: 150 })
    instaladoPor!: string;

    @Column({ name: "retirado_por", type: "character varying", length: 150, nullable: true })
    retiradoPor?: string;

    @Column({ type: "text", nullable: true })
    observaciones?: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @ManyToOne(() => ActivoEntity, { onDelete: "CASCADE" })
    @JoinColumn({ name: "activo_id" })
    activo!: ActivoEntity;

    @ManyToOne(() => SoftwareVersionEntity, { onDelete: "RESTRICT" })
    @JoinColumn({ name: "software_version_id" })
    softwareVersion!: SoftwareVersionEntity;
}
