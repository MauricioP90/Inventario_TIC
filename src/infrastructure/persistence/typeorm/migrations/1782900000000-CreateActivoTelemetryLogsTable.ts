import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateActivoTelemetryLogsTable1782900000000 implements MigrationInterface {
    name = 'CreateActivoTelemetryLogsTable1782900000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "activo_telemetry_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "activo_id" uuid NOT NULL,
                "placa" character varying(60) NOT NULL,
                "reported_coords" character varying(80) NOT NULL,
                "reported_ip" character varying(60),
                "expected_location_id" uuid,
                "expected_location_name" character varying(150),
                "detected_location_id" uuid,
                "detected_location_name" character varying(180),
                "distance_km" numeric(10,2),
                "status" character varying(40) NOT NULL DEFAULT 'CONFORME',
                "alert_sent" boolean NOT NULL DEFAULT false,
                "notification_uuid" character varying(100),
                "observaciones" text,
                "reported_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_activo_telemetry_logs_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_activo_telemetry_activo_id" FOREIGN KEY ("activo_id") REFERENCES "activos"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_activo_telemetry_activo_id" ON "activo_telemetry_logs" ("activo_id")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_activo_telemetry_status" ON "activo_telemetry_logs" ("status")
        `);

        await queryRunner.query(`
            ALTER TABLE "tipo_activos" ADD COLUMN IF NOT EXISTS "admite_telemetria" boolean NOT NULL DEFAULT false
        `);
        await queryRunner.query(`
            UPDATE "tipo_activos" SET "admite_telemetria" = "admite_software" WHERE "admite_software" = true
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "telemetry_settings" (
                "id" character varying(30) NOT NULL DEFAULT 'default',
                "tolerance_km" numeric(10,2) NOT NULL DEFAULT 1.5,
                "cooldown_hours" numeric(10,1) NOT NULL DEFAULT 12,
                "alerts_enabled" boolean NOT NULL DEFAULT true,
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_telemetry_settings_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            INSERT INTO "telemetry_settings" ("id", "tolerance_km", "cooldown_hours", "alerts_enabled")
            VALUES ('default', 1.5, 12, true)
            ON CONFLICT ("id") DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "telemetry_settings"`);
        await queryRunner.query(`ALTER TABLE "tipo_activos" DROP COLUMN IF EXISTS "admite_telemetria"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "activo_telemetry_logs"`);
    }
}

