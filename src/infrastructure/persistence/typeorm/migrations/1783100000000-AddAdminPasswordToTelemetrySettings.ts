import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdminPasswordToTelemetrySettings1783100000000 implements MigrationInterface {
    name = 'AddAdminPasswordToTelemetrySettings1783100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "telemetry_settings"
            ADD COLUMN IF NOT EXISTS "admin_password" varchar(255) DEFAULT 'FLM#Admin2026';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "telemetry_settings"
            DROP COLUMN IF EXISTS "admin_password";
        `);
    }
}
