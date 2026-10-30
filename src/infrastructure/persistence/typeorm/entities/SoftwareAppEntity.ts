import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { SoftwareVersionEntity } from "./SoftwareVersionEntity";

@Entity("software_apps")
export class SoftwareAppEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "character varying", length: 150, unique: true })
    nombre!: string;

    @Column({ type: "text", nullable: true })
    descripcion?: string;

    @Column({ type: "character varying", length: 20, default: "ACTIVO" })
    estado!: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;

    @OneToMany(() => SoftwareVersionEntity, version => version.softwareApp)
    versiones!: SoftwareVersionEntity[];
}
