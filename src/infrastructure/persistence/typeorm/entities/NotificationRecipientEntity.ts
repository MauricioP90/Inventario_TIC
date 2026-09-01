import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('notification_recipients')
export class NotificationRecipientEntity {
    @PrimaryColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    email!: string;

    @Column({ type: 'varchar', length: 255 })
    nombre!: string;

    @Column({ type: 'varchar', length: 255 })
    area!: string;

    @Column({ name: 'tipo_copia', type: 'varchar', length: 10, default: 'CC' })
    tipoCopia!: 'CC' | 'BCC';

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ type: 'simple-array', default: 'DESPACHO_TRASLADO,RECEPCION_TRASLADO' })
    eventos!: string[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}
