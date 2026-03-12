import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSimAndResponsible1772486371660 implements MigrationInterface {
    name = 'AddSimAndResponsible1772486371660'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sim_cards" ("id" uuid NOT NULL, "iccid" character varying NOT NULL, "numero" character varying NOT NULL, "operador" character varying NOT NULL, "estado" character varying NOT NULL, "activo_id" uuid, CONSTRAINT "PK_1c5376c7737592f2a7258be3d9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "responsables" ("id" uuid NOT NULL, "nombre" character varying NOT NULL, "email" character varying NOT NULL, "telefono" character varying NOT NULL, "estado" character varying NOT NULL, CONSTRAINT "UQ_ea8e6ee27312d2469e86ae1d43f" UNIQUE ("email"), CONSTRAINT "PK_559bd6d53e72c0656f3b572c440" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sim_cards" ADD CONSTRAINT "FK_fa36b0742f7f07e5c924963e7f2" FOREIGN KEY ("activo_id") REFERENCES "activos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sim_cards" DROP CONSTRAINT "FK_fa36b0742f7f07e5c924963e7f2"`);
        await queryRunner.query(`DROP TABLE "responsables"`);
        await queryRunner.query(`DROP TABLE "sim_cards"`);
    }

}
