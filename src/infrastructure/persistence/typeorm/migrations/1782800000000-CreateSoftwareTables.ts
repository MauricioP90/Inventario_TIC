import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSoftwareTables1782800000000 implements MigrationInterface {
    name = 'CreateSoftwareTables1782800000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "software_apps" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nombre" character varying(150) NOT NULL,
                "descripcion" text,
                "estado" character varying(20) NOT NULL DEFAULT 'ACTIVO',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_software_apps_nombre" UNIQUE ("nombre"),
                CONSTRAINT "PK_software_apps_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "software_versions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "software_app_id" uuid NOT NULL,
                "version" character varying(50) NOT NULL,
                "es_vigente" boolean NOT NULL DEFAULT false,
                "notas_lanzamiento" text,
                "fecha_lanzamiento" TIMESTAMP NOT NULL DEFAULT now(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_software_app_version" UNIQUE ("software_app_id", "version"),
                CONSTRAINT "PK_software_versions_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_software_versions_app_id" FOREIGN KEY ("software_app_id") REFERENCES "software_apps"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_software_versions_app_id" ON "software_versions" ("software_app_id")
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "activo_software_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "activo_id" uuid NOT NULL,
                "software_version_id" uuid NOT NULL,
                "licencia" character varying(100),
                "estado" character varying(20) NOT NULL DEFAULT 'INSTALADO',
                "fecha_instalacion" TIMESTAMP NOT NULL DEFAULT now(),
                "fecha_retiro" TIMESTAMP,
                "instalado_por" character varying(150) NOT NULL,
                "retirado_por" character varying(150),
                "observaciones" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_activo_software_history_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_activo_software_activo_id" FOREIGN KEY ("activo_id") REFERENCES "activos"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_activo_software_version_id" FOREIGN KEY ("software_version_id") REFERENCES "software_versions"("id") ON DELETE RESTRICT
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_activo_software_activo_id" ON "activo_software_history" ("activo_id")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_activo_software_version_id" ON "activo_software_history" ("software_version_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "activo_software_history"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "software_versions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "software_apps"`);
    }
}
