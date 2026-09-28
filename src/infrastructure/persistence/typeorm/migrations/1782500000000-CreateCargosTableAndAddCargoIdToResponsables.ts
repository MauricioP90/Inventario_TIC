import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCargosTableAndAddCargoIdToResponsables1782500000000 implements MigrationInterface {
    name = 'CreateCargosTableAndAddCargoIdToResponsables1782500000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "cargos" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nombre" character varying NOT NULL,
                "estado" character varying NOT NULL DEFAULT 'ACTIVO',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_cargos_nombre" UNIQUE ("nombre"),
                CONSTRAINT "PK_cargos_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            INSERT INTO "cargos" ("id", "nombre", "estado") VALUES
            (uuid_generate_v4(), 'Auxiliar', 'ACTIVO'),
            (uuid_generate_v4(), 'Analista', 'ACTIVO'),
            (uuid_generate_v4(), 'Coordinador', 'ACTIVO'),
            (uuid_generate_v4(), 'Conductor', 'ACTIVO'),
            (uuid_generate_v4(), 'Técnico', 'ACTIVO'),
            (uuid_generate_v4(), 'Director', 'ACTIVO'),
            (uuid_generate_v4(), 'Especialista', 'ACTIVO'),
            (uuid_generate_v4(), 'Jefe de Área', 'ACTIVO')
        `);

        await queryRunner.query(`ALTER TABLE "responsables" ADD "cargo_id" uuid`);
        await queryRunner.query(`
            ALTER TABLE "responsables" 
            ADD CONSTRAINT "FK_responsables_cargo_id" 
            FOREIGN KEY ("cargo_id") REFERENCES "cargos"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "responsables" DROP CONSTRAINT IF EXISTS "FK_responsables_cargo_id"`);
        await queryRunner.query(`ALTER TABLE "responsables" DROP COLUMN IF EXISTS "cargo_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "cargos"`);
    }
}
