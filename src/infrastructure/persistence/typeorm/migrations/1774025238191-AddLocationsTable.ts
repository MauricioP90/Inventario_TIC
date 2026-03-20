import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationsTable1774025238191 implements MigrationInterface {
    name = 'AddLocationsTable1774025238191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "locations" ("id" uuid NOT NULL, "code" character varying NOT NULL, "nombre" character varying NOT NULL, "responsableId" character varying NOT NULL, "direccion" character varying NOT NULL, "estado" character varying NOT NULL, CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "locations"`);
    }

}
