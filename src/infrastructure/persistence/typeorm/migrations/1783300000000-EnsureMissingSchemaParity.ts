import { MigrationInterface, QueryRunner } from "typeorm";

export class EnsureMissingSchemaParity1783300000000 implements MigrationInterface {
    name = 'EnsureMissingSchemaParity1783300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "modelos_activos" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tipo_activo_id" uuid NOT NULL,
                "marca" character varying NOT NULL,
                "modelo" character varying NOT NULL,
                "estado" character varying NOT NULL DEFAULT 'ACTIVO',
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_modelos_activos_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_modelos_activos_tipo" FOREIGN KEY ("tipo_activo_id") REFERENCES "tipo_activos"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "activo_document_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "activo_id" uuid NOT NULL,
                "previous_factura_url" text,
                "new_factura_url" text,
                "previous_precio_compra" numeric(12,2),
                "new_precio_compra" numeric(12,2),
                "changed_by_user" character varying,
                "justification" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_activo_document_history_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_activo_document_history_activo" FOREIGN KEY ("activo_id") REFERENCES "activos"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`ALTER TABLE "tipo_activos" ADD COLUMN IF NOT EXISTS "admite_software" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "sim_cards" ADD COLUMN IF NOT EXISTS "location_id" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "activo_document_history"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "modelos_activos"`);
    }
}
