import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { SoftwareAppEntity } from "./SoftwareAppEntity";
import { ActivoSoftwareHistoryEntity } from "./ActivoSoftwareHistoryEntity";

@Entity("software_versions")
export class SoftwareVersionEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name: "software_app_id", type: "uuid" })
    softwareAppId!: string;

    @Column({ type: "character varying", length: 50 })
    version!: string;

    @Column({ name: "es_vigente", type: "boolean", default: false })
    esVigente!: boolean;

    @Column({ name: "notas_lanzamiento", type: "text", nullable: true })
    notasLanzamiento?: string;

    @Column({ name: "fecha_lanzamiento", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    fechaLanzamiento!: Date;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @ManyToOne(() => SoftwareAppEntity, app => app.versiones, { onDelete: "CASCADE" })
    @JoinColumn({ name: "software_app_id" })
    softwareApp!: SoftwareAppEntity;

    @OneToMany(() => ActivoSoftwareHistoryEntity, history => history.softwareVersion)
    instalaciones!: ActivoSoftwareHistoryEntity[];
}
