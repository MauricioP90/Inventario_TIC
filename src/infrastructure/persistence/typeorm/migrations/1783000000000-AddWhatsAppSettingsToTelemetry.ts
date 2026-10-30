import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWhatsAppSettingsToTelemetry1783000000000 implements MigrationInterface {
    name = 'AddWhatsAppSettingsToTelemetry1783000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "telemetry_settings"
            ADD COLUMN IF NOT EXISTS "whatsapp_enabled" boolean NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS "whatsapp_notify_custodian" boolean NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS "whatsapp_cargo_ids" text NOT NULL DEFAULT '[]';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "telemetry_settings"
            DROP COLUMN IF EXISTS "whatsapp_cargo_ids",
            DROP COLUMN IF EXISTS "whatsapp_notify_custodian",
            DROP COLUMN IF EXISTS "whatsapp_enabled";
        `);
    }
}

