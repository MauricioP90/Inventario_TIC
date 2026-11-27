import { MigrationInterface, QueryRunner } from "typeorm";
import { DEFAULT_ROLE_PERMISSIONS } from "../../../security/RolePermissionService";

export class CreateRolePermissionsTable1783400000000 implements MigrationInterface {
    name = 'CreateRolePermissionsTable1783400000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "role_permissions" (
                "role_name" character varying(50) NOT NULL,
                "permissions" jsonb NOT NULL,
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_by" character varying(150),
                CONSTRAINT "PK_role_permissions_role_name" PRIMARY KEY ("role_name")
            )
        `);

        for (const [roleName, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
            await queryRunner.query(
                `INSERT INTO "role_permissions" ("role_name", "permissions", "updated_by")
                 VALUES ($1, $2::jsonb, 'system_seed')
                 ON CONFLICT ("role_name") DO NOTHING`,
                [roleName, JSON.stringify(permissions)]
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    }
}
