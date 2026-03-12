import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1772484286559 implements MigrationInterface {
    name = 'InitialSchema1772484286559'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "activos" ("id" uuid NOT NULL, "placa" character varying NOT NULL, "tipo" character varying NOT NULL, "marca" character varying NOT NULL, "modelo" character varying NOT NULL, "serial" character varying NOT NULL, "estado" character varying NOT NULL, "factura_url" character varying, "fecha_ingreso" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_98ccee15e4844deb3773dcf98b7" UNIQUE ("placa"), CONSTRAINT "UQ_32a588af4461c192abc0be34c5b" UNIQUE ("serial"), CONSTRAINT "PK_6a8f8eb920ce79c617c5a10e2d9" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "activos"`);
    }

}
