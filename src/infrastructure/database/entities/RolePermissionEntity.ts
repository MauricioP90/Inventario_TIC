import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('role_permissions')
export class RolePermissionEntity {
    @PrimaryColumn({ name: 'role_name', type: 'varchar', length: 50 })
    roleName!: string;

    @Column({ type: 'jsonb' })
    permissions!: Record<string, boolean>;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt!: Date;

    @Column({ name: 'updated_by', type: 'varchar', length: 150, nullable: true })
    updatedBy?: string | null;
}
