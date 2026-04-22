import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTipoActivo1776865797965 implements MigrationInterface {
    name = 'AddTipoActivo1776865797965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activos" RENAME COLUMN "tipo" TO "tipo_activo_id"`);
        await queryRunner.query(`CREATE TABLE "tipo_activos" ("id" uuid NOT NULL, "nombre" character varying NOT NULL, "estado" character varying NOT NULL, CONSTRAINT "PK_d7279d9f90f8e6daa5b8e816b95" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "activos" DROP COLUMN "tipo_activo_id"`);
        await queryRunner.query(`ALTER TABLE "activos" ADD "tipo_activo_id" uuid`);
        await queryRunner.query(`ALTER TABLE "activos" ADD CONSTRAINT "FK_f4983748c2c962021092348aacc" FOREIGN KEY ("tipo_activo_id") REFERENCES "tipo_activos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activos" DROP CONSTRAINT "FK_f4983748c2c962021092348aacc"`);
        await queryRunner.query(`ALTER TABLE "activos" DROP COLUMN "tipo_activo_id"`);
        await queryRunner.query(`ALTER TABLE "activos" ADD "tipo_activo_id" character varying NOT NULL`);
        await queryRunner.query(`DROP TABLE "tipo_activos"`);
        await queryRunner.query(`ALTER TABLE "activos" RENAME COLUMN "tipo_activo_id" TO "tipo"`);
    }

}
