import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTelemetryResolutionFields1783500000000 implements MigrationInterface {
    name = 'AddTelemetryResolutionFields1783500000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activo_telemetry_logs" ADD COLUMN IF NOT EXISTS "resolution_status" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "activo_telemetry_logs" ADD COLUMN IF NOT EXISTS "resolution_type" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "activo_telemetry_logs" ADD COLUMN IF NOT EXISTS "resolution_notes" text`);
        await queryRunner.query(`ALTER TABLE "activo_telemetry_logs" ADD COLUMN IF NOT EXISTS "resolved_by" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "activo_telemetry_logs" ADD COLUMN IF NOT EXISTS "resolved_at" TIMESTAMP`);

        await queryRunner.query(`
            UPDATE "activo_telemetry_logs"
            SET "resolution_status" = 'PENDIENTE'
            WHERE "status" = 'CONTROVERSIA_UBICACION' AND "resolution_status" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activo_telemetry_logs" DROP COLUMN IF EXISTS "resolved_at"`);
        await queryRunner.query(`ALTER TABLE "activo_telemetry_logs" DROP COLUMN IF EXISTS "resolved_by"`);
        await queryRunner.query(`ALTER TABLE "activo_telemetry_logs" DROP COLUMN IF EXISTS "resolution_notes"`);
        await queryRunner.query(`ALTER TABLE "activo_telemetry_logs" DROP COLUMN IF EXISTS "resolution_type"`);
        await queryRunner.query(`ALTER TABLE "activo_telemetry_logs" DROP COLUMN IF EXISTS "resolution_status"`);
    }
}
